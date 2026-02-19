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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useState, useEffect } from 'react';
import { generateFeedbackQuestions } from '@/ai/ai-feedback-questions';
import { Skeleton } from '@/components/ui/skeleton';

const feedbackOptions = ["Bad", "Satisfactory", "Good", "Best"];

const createFormSchema = (questions: string[]) => z.object({
  subjectId: z.string({ required_error: 'Please select a subject.' }),
  answers: z.record(z.string()).refine(
    (answers) => questions.every((q, index) => !!answers[index]),
    { message: "Please answer all questions before submitting." }
  ),
});

export default function StudentFeedbackPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const formSchema = createFormSchema(questions);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: '',
      answers: {},
    },
  });

  const selectedSubjectId = form.watch('subjectId');

  useEffect(() => {
    if (selectedSubjectId) {
      const fetchQuestions = async () => {
        setIsLoadingQuestions(true);
        setQuestions([]);
        form.setValue('answers', {}); 
        try {
          const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
          if (selectedSubject) {
            const result = await generateFeedbackQuestions({ subjectName: selectedSubject.name });
            setQuestions(result.questions);
          }
        } catch (error) {
          console.error("Error generating feedback questions:", error);
          toast({
            variant: "destructive",
            title: "Could not load questions",
            description: "There was an error generating feedback questions for this subject."
          });
        } finally {
          setIsLoadingQuestions(false);
        }
      };
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedSubjectId, form, toast]);


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

    const questionAnswers = questions.map((question, index) => ({
        question,
        answer: data.answers[index],
    }));

    const feedbackData = {
      studentId: user.uid,
      teacherId: selectedSubject.teacherId,
      teacherName: selectedSubject.teacherName,
      subject: selectedSubject.name,
      questionAnswers,
      createdAt: serverTimestamp(),
    };
    
    try {
      addDocumentNonBlocking(collection(firestore, 'feedbacks'), feedbackData);
      toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback!' });
      form.reset();
      setQuestions([]);
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
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject to give feedback" />
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
              {isLoadingQuestions && (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              )}

              {questions.length > 0 && (
                <div className="space-y-6 rounded-md border p-4">
                  {questions.map((question, index) => (
                     <FormField
                        key={index}
                        control={form.control}
                        name={`answers.${index}`}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>{question}</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-x-6 gap-y-2"
                              >
                                {feedbackOptions.map(option => (
                                    <FormItem key={option} className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value={option} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{option}</FormLabel>
                                    </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  ))}
                </div>
              )}
               <FormMessage>{form.formState.errors.answers?.root?.message}</FormMessage>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUserLoading || isSubmitting || questions.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
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
                    {fb.questionAnswers ? (
                         <div className="space-y-2 mt-2">
                            {fb.questionAnswers.map((qa: any, i: number) => (
                                <div key={i} className="text-sm">
                                    <p className="font-medium">{qa.question}</p>
                                    <p className="text-muted-foreground pl-4">&bull; {qa.answer}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm">{fb.feedback}</p>
                    )}
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
