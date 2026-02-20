"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
} from "@/firebase";
import { doc, collection, serverTimestamp } from "firebase/firestore";

export default function QuizTakingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const id = params.id as string;

  const quizDocRef = useMemoFirebase(
    () => (id ? doc(firestore, "quizzes", id) : null),
    [id, firestore]
  );
  const { data: quiz, isLoading: isLoadingQuiz } = useDoc(quizDocRef);

  const questionsCollectionRef = useMemoFirebase(
    () => (id ? collection(firestore, "quizzes", id, "quizQuestions") : null),
    [id, firestore]
  );
  const { data: quizQuestions, isLoading: isLoadingQuestions } =
    useCollection(questionsCollectionRef);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quiz && !isLoadingQuiz) {
      setTimeLeft(quiz.duration * 60);
    }
  }, [quiz, isLoadingQuiz]);

  const handleSubmit = useCallback(async () => {
    if (!user || !quiz || !quizQuestions) return;

    setIsSubmitting(true);

    const attemptData = {
      quizId: quiz.id,
      studentId: user.uid,
      studentAnswers: JSON.stringify(answers),
      tabSwitchCount: tabSwitches,
      autoSubmissionFlag: timeLeft <= 1,
      submittedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(
        collection(firestore, "quizzes", quiz.id, "quizAttempts"),
        attemptData
      );
      toast({
        title: "Quiz Submitted",
        description: "Your quiz has been submitted successfully.",
      });
      router.push("/dashboard/student/quizzes");
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your answers.",
      });
      setIsSubmitting(false);
    }
  }, [user, quiz, quizQuestions, answers, tabSwitches, timeLeft, firestore, router, toast]);

  useEffect(() => {
    if (!quiz || isLoadingQuiz) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        toast({
          variant: "destructive",
          title: "Proctoring Alert",
          description: "Tab switch detected. This may affect your result.",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSubmit, toast, quiz, isLoadingQuiz]);

  const handleNext = () => {
    if (quizQuestions && currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const isLoading = isLoadingQuiz || isLoadingQuestions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Not Found</CardTitle>
          <CardDescription>
            This quiz could not be found or is no longer available.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/dashboard/student/quizzes")}>
            Back to Quizzes
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>
            This quiz currently has no questions.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/dashboard/student/quizzes")}>
            Back to Quizzes
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-6" />
          <div className="prose dark:prose-invert max-w-none">
            <p className="font-semibold text-lg">{currentQuestion?.questionText}</p>
            <p className="mt-4 text-sm text-muted-foreground">
                Question options are not available for this quiz format. Please proceed.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {quizQuestions && currentQuestionIndex < quizQuestions.length - 1
              ? "Next Question"
              : "Submit Quiz"}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-code text-center">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </div>
          </CardContent>
        </Card>
        <Alert variant={tabSwitches > 2 ? "destructive" : "default"}>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>AI Proctoring</AlertTitle>
          <AlertDescription>
            <p>Your session is being monitored.</p>
            <p>Tab Switches: {tabSwitches}</p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
