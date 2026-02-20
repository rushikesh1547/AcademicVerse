'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useFirebaseApp,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { collection, query, where, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useRef } from 'react';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  subject: z.string().min(2, 'Subject is required.'),
  branch: z.string().min(2, 'Branch is required.'),
  currentYear: z.coerce.number().min(1, 'Year must be a positive number.'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required.'),
  file: z.any().optional(),
});

export default function CreateAssignmentPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const storage = getStorage(firebaseApp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subject: '',
      branch: '',
      currentYear: undefined,
      description: '',
      dueDate: '',
      file: undefined,
    },
  });

  const assignmentsQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(firestore, 'assignments'), where('teacherId', '==', user.uid))
        : null,
    [user, firestore]
  );
  const { data: assignments, isLoading: isLoadingAssignments } =
    useCollection(assignmentsQuery);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to create an assignment.',
      });
      return;
    }

    setIsSubmitting(true);

    const assignmentData = {
      title: data.title,
      subject: data.subject,
      branch: data.branch,
      currentYear: data.currentYear,
      description: data.description || '',
      dueDate: data.dueDate,
      fileUrl: '',
      teacherId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      const assignmentsCollection = collection(firestore, 'assignments');
      const docRef = await addDoc(assignmentsCollection, assignmentData);

      toast({
        title: 'Assignment Created',
        description: `${data.title} has been added to the list.`,
      });

      if (data.file) {
        toast({
          title: 'File Uploading...',
          description: `Uploading file for "${data.title}".`,
        });

        const file = data.file;
        const storageRef = ref(storage, `assignments/${user.uid}/${docRef.id}-${file.name}`);

        uploadBytes(storageRef, file)
          .then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
              updateDoc(docRef, { fileUrl: downloadURL });
            });
          })
          .catch((error) => {
            console.error('Error uploading file:', error);
            toast({
              variant: 'destructive',
              title: 'File Upload Failed',
              description: `Could not upload the file for ${data.title}.`,
            });
          });
      }

      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'There was an error creating the assignment.',
      });
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: 'assignments',
          operation: 'create',
          requestResourceData: assignmentData,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="h-6 w-6" />
            Create Assignment
          </CardTitle>
          <CardDescription>
            Fill out the form to create a new assignment for your students.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Algebra Worksheet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className='md:col-span-2'>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="currentYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide instructions for the assignment."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Assignment File (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        ref={fileInputRef}
                        value={undefined}
                        type="file"
                        onChange={(event) =>
                          onChange(event.target.files && event.target.files[0])
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a PDF, DOCX, or other document.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isUserLoading || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Assignment
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Created Assignments</CardTitle>
          <CardDescription>
            A list of assignments you have created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.title}
                    </TableCell>
                    <TableCell>{assignment.dueDate && assignment.dueDate.split('-').reverse().join('-')}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/teacher/assignments/${assignment.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Submissions
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              You have not created any assignments yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
