'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, UserCheck, CheckCircle, CircleOff } from 'lucide-react';

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const firestore = useFirestore();

  // Fetch the current session
  const sessionRef = useMemoFirebase(
    () => (sessionId ? doc(firestore, 'attendanceSessions', sessionId) : null),
    [sessionId, firestore]
  );
  const { data: session, isLoading: isLoadingSession } = useDoc(sessionRef);

  // Fetch all students
  const studentsQuery = useMemoFirebase(
      () => query(collection(firestore, 'users'), where('role', '==', 'student')),
      [firestore]
  );
  const { data: allStudents, isLoading: isLoadingStudents } = useCollection(studentsQuery);

  // Combine student list with attendance data from the session document
  const attendanceList = useMemo(() => {
    if (!allStudents || !session) return [];
    
    // Use the presentStudentIds array from the session document as the source of truth
    const presentStudentIds = new Set(session.presentStudentIds || []);

    return allStudents.map(student => ({
      ...student,
      isPresent: presentStudentIds.has(student.id),
    }));
  }, [allStudents, session]);
  
  const isLoading = isLoadingSession || isLoadingStudents;

  return (
    <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Attendance
        </Button>

        <Card>
        <CardHeader>
            <CardTitle>{isLoadingSession ? <Loader2 className="animate-spin"/> : session?.title}</CardTitle>
            <CardDescription>
            {isLoadingSession ? 'Loading session details...' : `Status: ${session?.status} | Date: ${session?.startTime?.toDate().toLocaleDateString()}`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <UserCheck />
                Student Attendance Report
            </h3>
            {isLoading ? (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : attendanceList && attendanceList.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attendanceList.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.displayName}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant={student.isPresent ? 'default' : 'destructive'} className='gap-1.5 pl-1.5'>
                                {student.isPresent ? <CheckCircle className='h-4 w-4'/> : <CircleOff className='h-4 w-4'/>}
                                {student.isPresent ? 'Present' : 'Absent'}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    Could not load student list or no students found.
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
