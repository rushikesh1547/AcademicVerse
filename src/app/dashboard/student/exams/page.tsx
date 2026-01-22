
"use client";

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
  FormDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const subjects: any[] = [];
const formSchema = z.object({
  examType: z.string({ required_error: "Please select an exam type." }),
  subjectIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one subject.",
  }),
});

export default function ExamsPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examType: "regular",
      subjectIds: [],
    },
  });

  const examFormsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'examForms'), where('studentId', '==', user.uid)) : null,
    [user, firestore]
  );
  const { data: submittedForms, isLoading: isLoadingForms } = useCollection(examFormsQuery);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "You must be logged in to submit a form.",
        });
        return;
    }

    await addDocumentNonBlocking(collection(firestore, "examForms"), {
        studentId: user.uid,
        examType: data.examType,
        subjectsSelected: data.subjectIds.map(id => subjects.find(s => s.id === id)?.name),
        approvalStatus: "Pending",
    });

    toast({
        title: "Form Submitted",
        description: "Your exam form has been submitted for approval.",
    });
    form.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-6 w-6" />
            Examination Form
          </CardTitle>
          <CardDescription>
            Manage your regular and backlog examination registrations here.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="examType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Exam Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an exam type" />
                                </SelectTrigger>
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
                    <FormField
                        control={form.control}
                        name="subjectIds"
                        render={() => (
                            <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Select Subjects</FormLabel>
                                <FormDescription>
                                Select the subjects you want to register for.
                                </FormDescription>
                            </div>
                            {subjects.length > 0 ? subjects.map((item) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name="subjectIds"
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={item.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== item.id
                                                    )
                                                );
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        {item.name}
                                        </FormLabel>
                                    </FormItem>
                                    );
                                }}
                                />
                            )) : <p className="text-sm text-muted-foreground">No subjects available to select.</p>}
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isUserLoading || form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Form
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Submitted Forms</CardTitle>
            <CardDescription>A list of your submitted examination forms and their status.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingForms ? (
                <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>
            ) : submittedForms && submittedForms.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Exam Type</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submittedForms.map(form => (
                            <TableRow key={form.id}>
                                <TableCell className="capitalize">{form.examType}</TableCell>
                                <TableCell>{form.subjectsSelected.join(", ")}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={form.approvalStatus === 'Approved' ? 'default' : form.approvalStatus === 'Pending' ? 'secondary' : 'destructive'}>
                                        {form.approvalStatus}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-6">You have not submitted any exam forms yet.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
