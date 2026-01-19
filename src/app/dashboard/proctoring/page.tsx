"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  analyzeStudentBehavior,
  AnalyzeStudentBehaviorInput,
  AnalyzeStudentBehaviorOutput,
} from "@/ai/ai-anti-cheating";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Recreate the schema here for the form
const formSchema = z.object({
  studentId: z.string().min(1, "Student ID is required."),
  quizId: z.string().min(1, "Quiz ID is required."),
  tabSwitchCount: z.coerce.number().min(0, "Tab switch count cannot be negative."),
  resourceAccessLog: z.string().optional(),
  timeTaken: z.coerce.number().min(0, "Time taken cannot be negative."),
});


export default function ProctoringAnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStudentBehaviorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "STU-12345",
      quizId: "quiz-1",
      tabSwitchCount: 3,
      resourceAccessLog: "google.com, wikipedia.org",
      timeTaken: 600,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeStudentBehavior(values as AnalyzeStudentBehaviorInput);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing behavior:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            AI Proctoring Analysis
          </CardTitle>
          <CardDescription>
            Enter student quiz data to analyze for suspicious behavior.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., STU-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quizId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., quiz-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tabSwitchCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tab Switch Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Taken (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resourceAccessLog"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Access Log</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., google.com, wikipedia.org"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of accessed resources.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Analyzing..." : "Analyze Behavior"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>
            The AI-powered analysis of the student's behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p>Analyzing, please wait...</p>}
          {analysisResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Suspicious Activity Detected:</h3>
                <Badge variant={analysisResult.isSuspicious ? "destructive" : "default"}>
                    {analysisResult.isSuspicious ? "Yes" : "No"}
                </Badge>
              </div>
              {analysisResult.isSuspicious && (
                 <div>
                    <h3 className="font-semibold">Reasons:</h3>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        {analysisResult.suspiciousReasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                        ))}
                    </ul>
                 </div>
              )}
              <div>
                <h3 className="font-semibold">Recommendation:</h3>
                <p className="text-sm text-muted-foreground">{analysisResult.recommendation}</p>
              </div>
            </div>
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">Submit the form to see the analysis result.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
