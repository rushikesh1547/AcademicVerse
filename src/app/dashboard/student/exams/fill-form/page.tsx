'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useFirebaseApp, useDoc, useMemoFirebase } from "@/firebase"; // Import useDoc and useMemoFirebase
import { collection, serverTimestamp, addDoc, doc } from "firebase/firestore"; // Import doc
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';

const subjects = [
    { id: 'math101', name: 'Mathematics 101' },
    { id: 'phy101', name: 'Physics for Engineers' },
    { id: 'chem101', name: 'Introductory Chemistry' },
    { id: 'cs101', name: 'Introduction to Computer Science' },
    { id: 'eng101', name: 'English Composition' },
];

const formSchema = z.object({
  examType: z.string({ required_error: "Please select an exam type." }),
  subjectIds: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one subject.",
  }),
  feeReceipt: z.any().refine(file => file, 'Fee receipt is required.'),
});

const STEPS = [
    { id: 1, name: 'Exam Type' },
    { id: 2, name: 'Select Subjects' },
    { id: 3, name: 'Upload Receipt' },
];

export default function FillExamFormPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const firebaseApp = useFirebaseApp();
    const storage = getStorage(firebaseApp);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch user data from firestore
    const userDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'users', user.uid) : null),
      [user, firestore]
    );
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
  
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            examType: "regular",
            subjectIds: [],
            feeReceipt: undefined,
        },
    });

    const handleNext = async () => {
        let fields: ("examType" | "subjectIds" | "feeReceipt")[] = [];
        if (currentStep === 1) fields = ['examType'];
        if (currentStep === 2) fields = ['subjectIds'];
        if (currentStep === 3) fields = ['feeReceipt'];
        
        const isValid = await form.trigger(fields as any);
        if (isValid) {
            if (currentStep < STEPS.length) {
                setCurrentStep(step => step + 1);
            }
        }
    }

    const handlePrev = () => {
        setCurrentStep(step => step - 1);
    }

    async function onSubmit(data: z.infer<typeof formSchema>) {
        if (!user || !userData) {
            toast({ variant: "destructive", title: "Not Logged In", description: "User data is not available. Please try again." });
            return;
        }

        setIsSubmitting(true);
        let feeReceiptUrl = '';

        try {
            // Step 1: Upload receipt and get URL
            const receiptFile = data.feeReceipt;
            if (!receiptFile) { // This check is for type safety, the schema already validates it
                 toast({ variant: "destructive", title: "File Missing", description: "Fee receipt is required." });
                 setIsSubmitting(false);
                 return;
            }
            const storageRef = ref(storage, `fee-receipts/${user.uid}/${Date.now()}-${receiptFile.name}`);
            const snapshot = await uploadBytes(storageRef, receiptFile);
            feeReceiptUrl = await getDownloadURL(snapshot.ref);

        } catch (error: any) {
            console.error("Error uploading file:", error);
            toast({
                variant: "destructive",
                title: "File Upload Failed",
                description: "Could not upload your fee receipt. Please check storage permissions and try again.",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Step 2: Save form data to Firestore
            await addDoc(collection(firestore, "users", user.uid, "examForms"), {
                studentId: user.uid,
                studentName: userData.displayName, // Use displayName from Firestore user doc
                examType: data.examType,
                subjectsSelected: data.subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean),
                feeReceiptUrl,
                approvalStatus: "Pending",
                createdAt: serverTimestamp(),
            });

            toast({
                title: "Form Submitted",
                description: "Your exam form has been submitted for approval.",
            });
            router.push('/dashboard/student/exams');

        } catch (error) {
            console.error("Error saving form to Firestore:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Your file was uploaded, but we couldn't save the form. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const progress = ((currentStep - 1) / (STEPS.length -1)) * 100;

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exam Forms
            </Button>
            <Card>
                <CardHeader>
                <CardTitle>New Examination Form</CardTitle>
                <CardDescription>
                    Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="mb-8" />
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {currentStep === 1 && (
                                <FormField
                                    control={form.control}
                                    name="examType"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Exam Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select an exam type" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="backlog">Backlog</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            {currentStep === 2 && (
                                <FormField
                                    control={form.control}
                                    name="subjectIds"
                                    render={() => (
                                        <FormItem>
                                        <FormLabel>Select Subjects</FormLabel>
                                        <div className='space-y-2 rounded-md border p-4'>
                                            {subjects.map((item) => (
                                                <FormField
                                                    key={item.id}
                                                    control={form.control}
                                                    name="subjectIds"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        const newValue = checked
                                                                            ? [...(field.value || []), item.id]
                                                                            : field.value?.filter((value) => value !== item.id);
                                                                        field.onChange(newValue);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{item.name}</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                             {currentStep === 3 && (
                                <FormField
                                    control={form.control}
                                    name="feeReceipt"
                                    render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem>
                                            <FormLabel>Fee Receipt</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...fieldProps}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    onChange={(event) => onChange(event.target.files && event.target.files[0])}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            <CardFooter className="p-0 justify-between">
                                {currentStep > 1 ? (
                                    <Button type="button" variant="outline" onClick={handlePrev}>Previous</Button>
                                ) : <div />}
                                
                                {currentStep < STEPS.length ? (
                                    <Button type="button" onClick={handleNext}>Next</Button>
                                ) : (
                                    <Button type="submit" disabled={isUserLoading || isUserDataLoading || isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Form
                                    </Button>
                                )}
                            </CardFooter>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
