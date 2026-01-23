'use client';

import { useMemo } from 'react';
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
import { BarChart3, Loader2, CheckCircle, CircleOff } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, collectionGroup, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function AttendancePage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const sessionsQuery = useMemoFirebase(
    () => query(collection(firestore, 'attendanceSessions'), orderBy('startTime', 'desc')),
    [firestore]
  );
  const { data: sessions, isLoading: isLoadingSessions } = useCollection(sessionsQuery);

  const myIntervalsQuery = useMemoFirebase(
    () =>
      user
        ? query(collectionGroup(firestore, 'attendanceIntervals'), where('studentId', '==', user.uid))
        : null,
    [user, firestore]
  );
  const { data: myIntervals, isLoading: isLoadingIntervals } = useCollection(myIntervalsQuery);

  const myIntervalsMap = useMemo(() => {
    if (!myIntervals) return new Map();
    return new Map(myIntervals.map(interval => [interval.sessionId, interval]));
  }, [myIntervals]);

  const isLoading = isLoadingSessions || isLoadingIntervals;

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Attendance History
          </CardTitle>
          <CardDescription>
            Your attendance is marked by your teacher. Here are your records for all past sessions.
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
                        <TableHead>Session</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions && sessions.length > 0 ? (
                        sessions.map((session) => {
                            const hasAttended = myIntervalsMap.has(session.id);
                            // Only show sessions that have started
                            if (!session.startTime) return null;
                            return (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{session.title}</TableCell>
                                    <TableCell>{session.startTime?.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={hasAttended ? 'default' : 'destructive'} className="gap-1.5 pl-1.5">
                                            {hasAttended ? <CheckCircle className="h-4 w-4" /> : <CircleOff className="h-4 w-4" />}
                                            {hasAttended ? 'Present' : 'Absent'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No attendance records found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
