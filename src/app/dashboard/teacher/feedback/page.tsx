'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeacherFeedbackPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const feedbackQuery = useMemoFirebase(
    () => user ? query(collectionGroup(firestore, 'feedbacks'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );
  const { data: feedbacks, isLoading: isLoadingFeedbacks } = useCollection(feedbackQuery);

  const { feedbacksBySubject, subjects } = useMemo(() => {
    const feedbacksBySubject = new Map<string, any[]>();
    if (!feedbacks) {
      return { feedbacksBySubject, subjects: [] };
    }

    feedbacks.forEach(fb => {
      if (!feedbacksBySubject.has(fb.subject)) {
        feedbacksBySubject.set(fb.subject, []);
      }
      feedbacksBySubject.get(fb.subject)?.push(fb);
    });
    
    const sortedSubjects = Array.from(feedbacksBySubject.keys()).sort();
    return { feedbacksBySubject, subjects: sortedSubjects };

  }, [feedbacks]);

  const isLoading = isUserLoading || isLoadingFeedbacks;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Student Feedback
        </CardTitle>
        <CardDescription>
          Anonymous feedback submitted by students for your subjects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subjects.length > 0 ? (
            <Tabs defaultValue={subjects[0]} className="w-full">
                <TabsList className="flex-wrap h-auto justify-start">
                    {subjects.map(subject => (
                        <TabsTrigger key={subject} value={subject}>{subject}</TabsTrigger>
                    ))}
                </TabsList>
                {subjects.map(subject => (
                    <TabsContent key={subject} value={subject}>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-4">
                            {feedbacksBySubject.get(subject)?.map(fb => (
                                <div key={fb.id} className="p-4 rounded-lg border bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Received on {fb.createdAt?.toDate().toLocaleDateString()}
                                    </p>
                                    <p className="text-sm">{fb.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            No feedback has been received yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
