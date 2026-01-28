'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Loader2, ArrowLeft, FileUp, Eye } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useFirebaseApp } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';


const profileFormSchema = z.object({
  // Personal
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  nationality: z.string().optional(),
  // Academic
  enrollmentNumber: z.string().optional(),
  branch: z.string().optional(),
  currentYear: z.coerce.number().optional(),
  admissionDate: z.string().optional(),
  admissionCategory: z.string().optional(),
  // Contact
  mobileNumber: z.string().optional(),
  alternateEmail: z.string().email({ message: "Please enter a valid email."}).optional().or(z.literal('')),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  // Identity
  aadharNumber: z.string().length(12, { message: "Aadhar number must be 12 digits."}).optional().or(z.literal('')),
  // Parents
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
});

type DocumentType = 'collegeIdCardUrl' | 'casteCertificateUrl' | 'casteValidityUrl' | 'capOrManagementCertificateUrl' | 'pwdCertificateUrl' | 'panCardUrl';

const documentsToUpload: { docType: DocumentType; docName: string }[] = [
    { docType: 'collegeIdCardUrl', docName: 'College ID Card' },
    { docType: 'casteCertificateUrl', docName: 'Caste Certificate' },
    { docType: 'casteValidityUrl', docName: 'Caste Validity Certificate' },
    { docType: 'capOrManagementCertificateUrl', docName: 'CAP/Management Certificate' },
    { docType: 'pwdCertificateUrl', docName: 'PWD Certificate (if applicable)' },
    { docType: 'panCardUrl', docName: 'PAN Card' },
];

function UploadDocumentDialog({ userId, docType, docName, currentUrl }: { userId: string, docType: DocumentType, docName: string, currentUrl?: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const firebaseApp = useFirebaseApp();
    const userDocRef = doc(useFirestore(), 'users', userId);

    const handleUpload = async () => {
        if (!file) {
            toast({ title: "No file selected", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `documents/${userId}/${docType}/${file.name}`);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await updateDocumentNonBlocking(userDocRef, { [docType]: downloadURL });
            
            toast({ title: "Upload Successful!", description: `${docName} has been uploaded.` });
            document.getElementById(`close-dialog-${docType}`)?.click();
        } catch (error) {
            console.error("Error uploading document:", error);
            toast({ title: "Upload Failed", description: "There was an error uploading your document.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><FileUp className="mr-2 h-4 w-4" />Upload</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload {docName}</DialogTitle>
                    <DialogDescription>Select a file to upload. This will replace any existing file.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="doc-file">Document File</Label>
                    <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    {currentUrl && <p className="text-xs text-muted-foreground">An existing file will be overwritten.</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button id={`close-dialog-${docType}`} variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload File
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function EditProfilePage() {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userData } = useDoc(userDocRef);

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            dateOfBirth: '',
            gender: '',
            bloodGroup: '',
            nationality: '',
            enrollmentNumber: '',
            branch: '',
            currentYear: undefined,
            admissionDate: '',
            admissionCategory: '',
            mobileNumber: '',
            alternateEmail: '',
            currentAddress: '',
            permanentAddress: '',
            aadharNumber: '',
            fatherName: '',
            fatherOccupation: '',
            motherName: '',
            motherOccupation: '',
        },
    });

    useEffect(() => {
        if (userData) {
          form.reset({
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender || '',
            bloodGroup: userData.bloodGroup || '',
            nationality: userData.nationality || '',
            enrollmentNumber: userData.enrollmentNumber || '',
            branch: userData.branch || '',
            currentYear: userData.currentYear || undefined,
            admissionDate: userData.admissionDate || '',
            admissionCategory: userData.admissionCategory || '',
            mobileNumber: userData.mobileNumber || '',
            alternateEmail: userData.alternateEmail || '',
            currentAddress: userData.currentAddress || '',
            permanentAddress: userData.permanentAddress || '',
            aadharNumber: userData.aadharNumber || '',
            fatherName: userData.fatherName || '',
            fatherOccupation: userData.fatherOccupation || '',
            motherName: userData.motherName || '',
            motherOccupation: userData.motherOccupation || '',
          });
        }
    }, [userData, form]);

    async function onInfoSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!userDocRef) return;

        setIsSaving(true);
        try {
          await updateDocumentNonBlocking(userDocRef, values);
          toast({
            title: "Profile Saved",
            description: "Your detailed information has been updated.",
          });
        } catch (error) {
          console.error("Error updating profile details:", error);
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: "There was an error saving your information.",
          });
        } finally {
          setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/student/profile')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
            </Button>
            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onInfoSubmit)}>
                        <CardHeader>
                            <CardTitle>Detailed Information</CardTitle>
                            <CardDescription>
                                Provide your personal, academic, and other details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <fieldset className="space-y-4">
                                <legend className="text-lg font-medium">Personal Information</legend>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dateOfBirth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date of Birth</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bloodGroup"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Blood Group</FormLabel>
                                                <FormControl><Input placeholder="e.g., O+" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nationality"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nationality</FormLabel>
                                                <FormControl><Input placeholder="e.g., Indian" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </fieldset>
                            
                            <Separator />

                            <fieldset className="space-y-4">
                                <legend className="text-lg font-medium">Academic Information</legend>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="enrollmentNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enrollment Number</FormLabel>
                                                <FormControl><Input placeholder="Your student enrollment ID" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="branch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Branch / Department</FormLabel>
                                                <FormControl><Input placeholder="e.g., Computer Engineering" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="currentYear"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Year</FormLabel>
                                                <FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="admissionDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Admission Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="admissionCategory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Admission Category</FormLabel>
                                                <FormControl><Input placeholder="e.g., General" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </fieldset>

                            <Separator />

                            <fieldset className="space-y-4">
                                <legend className="text-lg font-medium">Contact Information</legend>
                                 <div className="grid md:grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="mobileNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobile Number</FormLabel>
                                                <FormControl><Input type="tel" placeholder="Your 10-digit mobile number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="alternateEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alternate Email</FormLabel>
                                                <FormControl><Input type="email" placeholder="Your alternate email address" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                 <FormField
                                    control={form.control}
                                    name="currentAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Address</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Your current place of residence" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="permanentAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Permanent Address</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Your permanent home address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </fieldset>

                            <Separator />

                            <fieldset className="space-y-4">
                                 <legend className="text-lg font-medium">Parent's Details</legend>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fatherName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Father's Name</FormLabel>
                                                <FormControl><Input placeholder="Father's full name" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fatherOccupation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Father's Occupation</FormLabel>
                                                <FormControl><Input placeholder="Father's occupation" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </div>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="motherName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mother's Name</FormLabel>
                                                <FormControl><Input placeholder="Mother's full name" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="motherOccupation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mother's Occupation</FormLabel>
                                                <FormControl><Input placeholder="Mother's occupation" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </div>
                            </fieldset>

                            <Separator />
                            
                             <fieldset className="space-y-4">
                                <legend className="text-lg font-medium">Identity Information</legend>
                                <FormField
                                    control={form.control}
                                    name="aadharNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Aadhar Number</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Enter 12-digit Aadhar number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </fieldset>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Details
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Document Management</CardTitle>
                    <CardDescription>Upload and manage your required documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {documentsToUpload.map(({ docType, docName }) => (
                        <div key={docType} className="flex items-center justify-between rounded-lg border p-3">
                            <p className="font-medium text-sm">{docName}</p>
                            <div className="flex items-center gap-2">
                                 <Button asChild variant="outline" size="sm" disabled={!userData?.[docType]}>
                                    <Link href={userData?.[docType] || '#'} target="_blank" rel="noopener noreferrer">
                                        <Eye className="mr-2 h-4 w-4" />View
                                    </Link>
                                </Button>
                                {user && <UploadDocumentDialog userId={user.uid} docType={docType} docName={docName} currentUrl={userData?.[docType]} />}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
