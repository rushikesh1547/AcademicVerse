'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, query, where, serverTimestamp, orderBy, collectionGroup } from 'firebase/firestore';
import { subjects } from '@/lib/subjects';
import { useState } from 'react';

const formSchema = z.object({
  subjectId: z.string({ required_error: 'Please select a subject.' }),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters.'),
});

export default function StudentFeedbackPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: '',
      feedback: '',
    },
  });

  const feedbackQuery = useMemoFirebase(
    () => user ? query(collectionGroup(firestore, 'feedbacks'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );
  const { data: previousFeedbacks, isLoading: isLoadingFeedbacks } = useCollection(feedbackQuery);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'You are not logged in.' });
      return;
    }
    
    const selectedSubject = subjects.find(s => s.id === data.subjectId);
    if (!selectedSubject) {
      toast({ variant: 'destructive', title: 'Invalid subject selected.' });
      return;
    }

    setIsSubmitting(true);

    const feedbackData = {
      studentId: user.uid,
      teacherId: selectedSubject.teacherId,
      teacherName: selectedSubject.teacherName,
      subject: selectedSubject.name,
      feedback: data.feedback,
      createdAt: serverTimestamp(),
    };
    
    try {
      addDocumentNonBlocking(collection(firestore, 'feedbacks'), feedbackData);
      toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback!' });
      form.reset();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your feedback.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-6 w-6" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Share your thoughts on your subjects. Your feedback is anonymous to the teacher.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {subjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name} (with {subject.teacherName})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us what you think..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUserLoading || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Past Feedback</CardTitle>
          <CardDescription>
            A history of the feedback you've submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFeedbacks ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previousFeedbacks && previousFeedbacks.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {previousFeedbacks.map((fb) => (
                <div key={fb.id} className="p-3 rounded-lg border bg-muted/50">
                    <p className="font-semibold text-sm">{fb.subject}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                        Submitted on {fb.createdAt?.toDate().toLocaleDateString()}
                    </p>
                    <p className="text-sm">{fb.feedback}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              You haven't submitted any feedback yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
