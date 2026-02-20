'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { FileText, Loader2, Upload } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  useFirebaseApp,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useDoc,
} from '@/firebase';
import {
  collection,
  query,
  where,
  serverTimestamp,
  collectionGroup,
  doc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

function SubmissionDialog({
  assignment,
  submission,
  user,
}: {
  assignment: any;
  submission: any;
  user: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const storage = getStorage(firebaseApp);
  const { toast } = useToast();

  const handleFileSubmit = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a file to upload.',
      });
      return;
    }
    if (!user) return;

    setIsUploading(true);

    const storageRef = ref(
      storage,
      `submissions/${assignment.id}/${user.uid}/${file.name}`
    );

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const submissionFileUrl = await getDownloadURL(snapshot.ref);

      const submissionData = {
        assignmentId: assignment.id,
        studentId: user.uid,
        teacherId: assignment.teacherId,
        studentName: user.displayName,
        submissionFileUrl,
        submissionTimestamp: serverTimestamp(),
        evaluationStatus: 'Submitted',
        marks: null,
      };

      if (submission) {
        // Update existing submission
        const submissionRef = doc(firestore, `assignments/${assignment.id}/assignmentSubmissions`, submission.id);
        updateDocumentNonBlocking(submissionRef, submissionData);
      } else {
        // Create new submission
        const submissionsRef = collection(
          firestore,
          `assignments/${assignment.id}/assignmentSubmissions`
        );
        addDocumentNonBlocking(submissionsRef, submissionData);
      }

      toast({
        title: 'Submission Successful!',
        description: 'Your assignment has been submitted.',
      });
      document.getElementById(`close-dialog-${assignment.id}`)?.click();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was an error submitting your assignment.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          {submission ? 'Resubmit' : 'Submit'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit: {assignment.title}</DialogTitle>
          <DialogDescription>
            Select a file to upload for your assignment submission.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
           {submission?.submissionFileUrl && (
            <p className="text-sm text-muted-foreground">
              You have already submitted a file. Uploading a new one will overwrite it.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button id={`close-dialog-${assignment.id}`} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleFileSubmit} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading...' : 'Submit File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const assignmentsQuery = useMemoFirebase(
    () =>
      userData?.branch && userData?.currentYear
        ? query(
            collection(firestore, 'assignments'),
            where('branch', '==', userData.branch),
            where('currentYear', '==', userData.currentYear)
          )
        : null,
    [firestore, userData]
  );
  const { data: assignments, isLoading: isLoadingAssignments } = useCollection(assignmentsQuery);

  const submissionsQuery = useMemoFirebase(
    () =>
      user
        ? query(collectionGroup(firestore, 'assignmentSubmissions'), where('studentId', '==', user.uid))
        : null,
    [user, firestore]
  );
  const { data: submissions } = useCollection(submissionsQuery);

  const combinedData = useMemo(() => {
    if (!assignments) return [];
    
    const submissionsMap = new Map(submissions?.map(sub => [sub.assignmentId, sub]) || []);

    return assignments.map(assignment => {
        const submission = submissionsMap.get(assignment.id);
        let status = 'Pending Submission';
        let marks = null;
        if (submission) {
            status = submission.evaluationStatus || 'Submitted';
            marks = submission.marks;
        }

        return {
            ...assignment,
            submission,
            status,
            marks,
        };
    });
  }, [assignments, submissions]);

  const isLoading = isUserDataLoading || isLoadingAssignments;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Assignments
        </CardTitle>
        <CardDescription>
          Here is a list of all your assignments. Submit your work before the
          due date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedData && combinedData.length > 0 ? (
                combinedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      {item.dueDate &&
                        item.dueDate.split('-').reverse().join('-')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'Evaluated'
                            ? 'default'
                            : item.status === 'Submitted'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {item.status === 'Evaluated' && item.marks !== null ? `${item.marks} / 10` : 'Not Graded'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        disabled={!item.fileUrl}
                      >
                        <Link href={item.fileUrl || '#'} target="_blank">
                          View Assignment
                        </Link>
                      </Button>
                      <SubmissionDialog assignment={item} submission={item.submission} user={user} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No assignments found for your branch and year.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
