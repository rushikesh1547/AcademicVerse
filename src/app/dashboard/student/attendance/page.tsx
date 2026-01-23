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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { BarChart3, Loader2, CheckCircle, CircleOff } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

type Session = {
  id: string;
  title: string;
  startTime: any;
  isPresent: boolean;
};

export default function AttendancePage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const sessionsQuery = useMemoFirebase(
    () => query(collection(firestore, 'attendanceSessions'), orderBy('startTime', 'desc')),
    [firestore]
  );
  const { data: sessions, isLoading: isLoadingSessions } = useCollection(sessionsQuery);

  const { attendanceBySubject, subjects } = useMemo(() => {
    const attendanceBySubject = new Map<string, Session[]>();
    if (!sessions || !user) {
      return { attendanceBySubject, subjects: [] };
    }

    sessions.forEach(session => {
      // This logic is a bit brittle but should work for "Subject Name - Details"
      const subject = session.title?.split(' - ')[0] || 'General';
      if (!attendanceBySubject.has(subject)) {
        attendanceBySubject.set(subject, []);
      }
      
      const isPresent = Array.isArray(session.presentStudentIds) && session.presentStudentIds.includes(user.uid);

      attendanceBySubject.get(subject)?.push({
        ...(session as any),
        isPresent,
      });
    });

    const sortedSubjects = Array.from(attendanceBySubject.keys()).sort();
    return { attendanceBySubject, subjects: sortedSubjects };
  }, [sessions, user]);

  const isLoading = isLoadingSessions;

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Attendance History
          </CardTitle>
          <CardDescription>
            Your attendance is marked by your teacher. Here are your records, organized by subject.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : subjects.length > 0 ? (
            <Tabs defaultValue={subjects[0]} className="w-full">
              <TabsList className="flex-wrap h-auto justify-start">
                {subjects.map(subject => (
                  <TabsTrigger key={subject} value={subject}>{subject}</TabsTrigger>
                ))}
              </TabsList>
              {subjects.map(subject => (
                <TabsContent key={subject} value={subject}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceBySubject.get(subject)?.map((session: Session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.title}</TableCell>
                          <TableCell>{session.startTime?.toDate().toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={session.isPresent ? 'default' : 'destructive'} className="gap-1.5 pl-1.5">
                              {session.isPresent ? <CheckCircle className="h-4 w-4" /> : <CircleOff className="h-4 w-4" />}
                              {session.isPresent ? 'Present' : 'Absent'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <div className="h-24 text-center flex justify-center items-center">
                No attendance records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
