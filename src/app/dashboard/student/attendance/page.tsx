'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
import { BarChart3, Loader2, Camera, CheckCircle, CircleOff } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AttendancePage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const sessionsQuery = useMemoFirebase(
    () => collection(firestore, 'attendanceSessions'),
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

  const activeSessions = useMemo(
    () => sessions?.filter(s => s.status === 'active') || [],
    [sessions]
  );
  
  const historicalSessions = useMemo(
    () => sessions?.filter(s => s.status !== 'active').sort((a, b) => (b.startTime?.toDate() || 0) - (a.startTime?.toDate() || 0)) || [],
    [sessions]
  );

  const isLoading = isLoadingSessions || isLoadingIntervals;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Attendance
          </CardTitle>
          <CardDescription>
            Mark your attendance for active sessions and view your past records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : activeSessions.length > 0 ? (
            <div className="grid gap-4">
                {activeSessions.map(session => {
                    const hasAttended = myIntervalsMap.has(session.id);
                    return (
                        <Alert key={session.id} variant="default">
                            <Camera className="h-4 w-4" />
                            <AlertTitle className="flex items-center justify-between">
                                {session.title}
                                {hasAttended ? (
                                    <Badge variant="default" className="gap-1.5 pl-1.5">
                                        <CheckCircle className="h-4 w-4" />
                                        Attended
                                    </Badge>
                                ) : (
                                    <Button asChild size="sm">
                                        <Link href={`/dashboard/student/attendance/mark?sessionId=${session.id}`}>
                                            Mark My Attendance
                                        </Link>
                                    </Button>
                                )}
                            </AlertTitle>
                            <AlertDescription>
                                This attendance session is currently active. Please mark your attendance now.
                            </AlertDescription>
                        </Alert>
                    )
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">There are no active attendance sessions right now.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Detailed attendance records for all past sessions.
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
                    {historicalSessions.length > 0 ? (
                        historicalSessions.map((session) => {
                            const hasAttended = myIntervalsMap.has(session.id);
                            return (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{session.title}</TableCell>
                                    <TableCell>{session.startTime?.toDate().toLocaleDateString() || 'N/A'}</TableCell>
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
                                No historical attendance records found.
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
