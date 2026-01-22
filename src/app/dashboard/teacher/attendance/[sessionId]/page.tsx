'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { doc, collection } from 'firebase/firestore';
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
import { Loader2, ArrowLeft, UserCheck } from 'lucide-react';

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const firestore = useFirestore();

  const sessionRef = useMemoFirebase(
    () => (sessionId ? doc(firestore, 'attendanceSessions', sessionId) : null),
    [sessionId, firestore]
  );
  const { data: session, isLoading: isLoadingSession } = useDoc(sessionRef);

  const intervalsRef = useMemoFirebase(
    () => (sessionId ? collection(firestore, 'attendanceSessions', sessionId, 'attendanceIntervals') : null),
    [sessionId, firestore]
  );
  const { data: intervals, isLoading: isLoadingIntervals } = useCollection(intervalsRef);
  
  const isLoading = isLoadingSession || isLoadingIntervals;

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
            {isLoadingSession ? 'Loading session details...' : `Status: ${session?.status}`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <UserCheck />
                Student Attendance
            </h3>
            {isLoading ? (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : intervals && intervals.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Verification</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {intervals.map((interval) => (
                    <TableRow key={interval.id}>
                        <TableCell className="font-medium">{interval.studentName}</TableCell>
                        <TableCell>{interval.timestamp?.toDate().toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={interval.presenceStatus ? 'default' : 'destructive'}>
                                {interval.presenceStatus ? 'Present' : 'Absent'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                            {interval.faceRecognitionData}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    No students have marked their attendance for this session yet.
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
