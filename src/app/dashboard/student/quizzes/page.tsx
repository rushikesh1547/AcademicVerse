'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Clock, HelpCircle, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";

export default function QuizzesPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const quizzesQuery = useMemoFirebase(() => 
    userData?.branch && userData?.currentYear
      ? query(
          collection(firestore, 'quizzes'),
          where('branch', '==', userData.branch),
          where('currentYear', '==', userData.currentYear)
        )
      : null,
    [firestore, userData]
  );
  const { data: quizzes, isLoading: isLoadingQuizzes } = useCollection(quizzesQuery);

  const isLoading = isUserDataLoading || isLoadingQuizzes;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Quizzes
          </CardTitle>
          <CardDescription>
            Here are the available quizzes for your branch and year.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            <Card className="sm:col-span-1 md:col-span-2 lg:col-span-3">
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        ) : quizzes && quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.subject}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span>Multiple Questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{quiz.duration} Minutes</span>
                </div>
                <Badge
                  variant="secondary"
                  className="w-fit"
                >
                  Upcoming
                </Badge>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/student/quizzes/${quiz.id}`}>
                    Start Quiz
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="sm:col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">No quizzes available for your branch and year.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
