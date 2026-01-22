'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  FirestorePermissionError,
  errorEmitter,
  useUser,
} from '@/firebase';
import { doc, collection, query, updateDoc, where } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    DialogClose,
  } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, BookCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function EvaluateDialog({ submission } : { submission: any }) {
    const [marks, setMarks] = useState(submission.marks || '');
    const [isLoading, setIsLoading] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSaveMarks = async () => {
        setIsLoading(true);
        const submissionRef = doc(firestore, `assignments/${submission.assignmentId}/assignmentSubmissions`, submission.id);
        const updatedData = {
            marks: Number(marks),
            evaluationStatus: 'Evaluated',
        };

        try {
            await updateDoc(submissionRef, updatedData);
            toast({
                title: 'Marks Saved!',
                description: `${submission.studentName}'s assignment has been graded.`,
            });
            document.getElementById(`close-eval-dialog-${submission.id}`)?.click();
        } catch (error) {
            console.error("Error saving marks:", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            }));
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save marks.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    <BookCheck className="mr-2 h-4 w-4" />
                    {submission.evaluationStatus === 'Evaluated' ? 'Re-evaluate' : 'Evaluate'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Evaluate: {submission.studentName}</DialogTitle>
                    <DialogDescription>
                        Review the submission and award marks out of 10.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <Button asChild variant="outline">
                        <Link href={submission.submissionFileUrl} target="_blank">
                            <Download className="mr-2 h-4 w-4" />
                            Download Submission
                        </Link>
                    </Button>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="marks" className="text-right">
                            Marks
                        </Label>
                        <Input 
                            id="marks" 
                            type="number" 
                            value={marks} 
                            onChange={(e) => setMarks(e.target.value)} 
                            className="col-span-3"
                            max={10}
                            min={0}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button id={`close-eval-dialog-${submission.id}`} variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveMarks} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Marks
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const assignmentRef = useMemoFirebase(
    () => (id ? doc(firestore, 'assignments', id) : null),
    [id, firestore]
  );
  const { data: assignment, isLoading: isLoadingAssignment } = useDoc(assignmentRef);

  const submissionsRef = useMemoFirebase(
    () => (id && user ? query(collection(firestore, 'assignments', id, 'assignmentSubmissions'), where('teacherId', '==', user.uid)) : null),
    [id, firestore, user]
  );
  const { data: submissions, isLoading: isLoadingSubmissions } = useCollection(submissionsRef);
  
  const isLoading = isLoadingAssignment || isLoadingSubmissions;

  return (
    <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
        </Button>

        <Card>
        <CardHeader>
            <CardTitle>{isLoadingAssignment ? <Loader2 className="animate-spin"/> : assignment?.title}</CardTitle>
            <CardDescription>
            {isLoadingAssignment ? 'Loading...' : `Subject: ${assignment?.subject} | Due: ${assignment?.dueDate.split('-').reverse().join('-')}`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="mb-4 text-lg font-semibold">Student Submissions</h3>
            {isLoading ? (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : submissions && submissions.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.studentName}</TableCell>
                        <TableCell>{sub.submissionTimestamp?.toDate().toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant={sub.evaluationStatus === 'Evaluated' ? 'default' : 'secondary'}>
                                {sub.evaluationStatus}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {sub.evaluationStatus === 'Evaluated' && sub.marks !== null ? `${sub.marks} / 10` : 'Not Graded'}
                        </TableCell>
                        <TableCell className="text-right">
                           <EvaluateDialog submission={sub} />
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    No students have submitted this assignment yet.
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
