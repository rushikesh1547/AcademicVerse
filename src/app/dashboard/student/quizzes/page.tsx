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
import { ClipboardCheck, Clock, HelpCircle } from "lucide-react";

export default function QuizzesPage() {
  const quizzes: any[] = [];
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Quizzes
          </CardTitle>
          <CardDescription>
            Here are the available quizzes. Choose one to start your assessment.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.subject}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span>{quiz.questions} Questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{quiz.duration} Minutes</span>
                </div>
                <Badge
                  variant={
                    quiz.status === "Upcoming" ? "secondary" : "default"
                  }
                  className="w-fit"
                >
                  {quiz.status}
                </Badge>
                {quiz.score && <p className="text-sm font-medium">Score: {quiz.score}</p>}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" disabled={quiz.status !== 'Upcoming'}>
                  <Link href={`/dashboard/student/quizzes/${quiz.id}`}>
                    {quiz.status === 'Upcoming' ? 'Start Quiz' : 'View Results'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="sm:col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">No quizzes available at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
