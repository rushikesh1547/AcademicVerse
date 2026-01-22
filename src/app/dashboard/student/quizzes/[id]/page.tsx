"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const quizzes: any[] = [];
const quizQuestions: any[] = [];

export default function QuizTakingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const quiz = quizzes.find((q) => q.id === id);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);

  useEffect(() => {
    if (quiz) {
      setTimeLeft(quiz.duration * 60);
    }
  }, [quiz]);

  const handleSubmit = useCallback(() => {
    toast({
        title: "Quiz Submitted",
        description: "Your quiz has been submitted successfully.",
    });
    router.push("/dashboard/student/quizzes");
  }, [router, toast]);

  useEffect(() => {
    if (!quiz) return;

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
  }, [handleSubmit, toast, quiz]);

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
        handleSubmit();
    }
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!quiz) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Quiz Not Found</CardTitle>
            <CardDescription>This quiz could not be found or is no longer available.</CardDescription>
        </CardHeader>
        <CardFooter>
            <Button onClick={() => router.push("/dashboard/student/quizzes")}>Back to Quizzes</Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (quizQuestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>This quiz currently has no questions.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/dashboard/student/quizzes")}>Back to Quizzes</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>Question {currentQuestionIndex + 1} of {quizQuestions.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-6" />
          <div className="prose dark:prose-invert max-w-none">
            <p className="font-semibold text-lg">{currentQuestion?.question}</p>
            <RadioGroup
              onValueChange={(value) => {
                const newAnswers = [...answers];
                newAnswers[currentQuestionIndex] = value;
                setAnswers(newAnswers);
              }}
              value={answers[currentQuestionIndex]}
              className="mt-4 space-y-2"
            >
              {currentQuestion?.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNext}>
            {currentQuestionIndex < quizQuestions.length - 1 ? "Next Question" : "Submit Quiz"}
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
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
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
