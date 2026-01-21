'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Award, Eye, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";

export default function ResultsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const resultsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'results')) : null,
    [user, firestore]
  );
  const { data: results, isLoading } = useCollection(resultsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-6 w-6" />
          Results
        </CardTitle>
        <CardDescription>
          View your published semester results and SGPA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
          </div>
        ) : results && results.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semester</TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead>SGPA</TableHead>
                <TableHead className="text-right">Detailed Grades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.semester}</TableCell>
                  <TableCell>{result.examType}</TableCell>
                  <TableCell>{result.sgpa?.toFixed(2) || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                      <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                              </Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>Semester {result.semester} Grades</DialogTitle>
                                  <DialogDescription>
                                      Detailed subject-wise grades for the {result.examType?.toLowerCase()} exam.
                                  </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                  {result.subjectGrades.split(',').map((grade: string, i: number) => (
                                      <p key={i}>{grade.trim()}</p>
                                  ))}
                              </div>
                          </DialogContent>
                      </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">You have no published results yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
