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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, BookUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useFirebaseApp,
  errorEmitter,
  FirestorePermissionError,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, serverTimestamp, addDoc, orderBy } from 'firebase/firestore';
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
  description: z.string().optional(),
  file: z.any().refine(file => file, 'A file is required.'),
});

export default function ManageLessonPlanPage() {
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
      description: '',
      file: undefined,
    },
  });

  const lessonPlansQuery = useMemoFirebase(
    () =>
      !isUserLoading && user
        ? query(collection(firestore, 'lessonPlans'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'))
        : null,
    [user, firestore, isUserLoading]
  );
  const { data: lessonPlans, isLoading: isLoadingLessonPlans } =
    useCollection(lessonPlansQuery);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to upload a lesson plan.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
        const file = data.file;
        const storageRef = ref(storage, `lessonPlans/${user.uid}/${Date.now()}-${file.name}`);
        
        toast({
          title: 'Uploading File...',
          description: 'Please wait while your file is being uploaded.',
        });

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const lessonPlanData = {
            title: data.title,
            subject: data.subject,
            description: data.description || '',
            fileUrl: downloadURL,
            teacherId: user.uid,
            teacherName: user.displayName || 'Unknown Teacher',
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'lessonPlans'), lessonPlanData);

        toast({
            title: 'Lesson Plan Uploaded',
            description: `${data.title} has been added.`,
        });

        form.reset();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      const lessonPlanData = {
            title: data.title,
            subject: data.subject,
            teacherId: user.uid,
      };
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: 'lessonPlans',
          operation: 'create',
          requestResourceData: lessonPlanData,
        })
      );
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was an error uploading the lesson plan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookUp className="h-6 w-6" />
            Upload Lesson Plan
          </CardTitle>
          <CardDescription>
            Fill out the form to upload a new lesson plan for your students.
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
                      <Input placeholder="e.g., Week 1: Introduction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
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
                        placeholder="Briefly describe the lesson plan."
                        {...field}
                      />
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
                    <FormLabel>Lesson Plan File</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        ref={fileInputRef}
                        value={undefined}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={(event) =>
                          onChange(event.target.files && event.target.files[0])
                        }
                      />
                    </FormControl>
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
                Upload Lesson Plan
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Lesson Plans</CardTitle>
          <CardDescription>
            A list of lesson plans you have uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLessonPlans ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lessonPlans && lessonPlans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.title}
                    </TableCell>
                    <TableCell>{plan.subject}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                           <Link href={plan.fileUrl} target="_blank">View</Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              You have not uploaded any lesson plans yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
