'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Play, Square, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
});

export default function TeacherAttendancePage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  });

  const sessionsQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(firestore, 'attendanceSessions'), where('teacherId', '==', user.uid))
        : null,
    [user, firestore]
  );
  const { data: sessions, isLoading: isLoadingSessions } = useCollection(sessionsQuery);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to create a session.',
      });
      return;
    }

    const sessionData = {
      title: data.title,
      teacherId: user.uid,
      status: 'pending',
    };

    addDocumentNonBlocking(collection(firestore, 'attendanceSessions'), sessionData);

    toast({
      title: 'Session Created',
      description: `${data.title} has been created and is ready to start.`,
    });
    form.reset();
  }

  const handleUpdateStatus = (sessionId: string, status: 'active' | 'ended') => {
    const sessionRef = doc(firestore, 'attendanceSessions', sessionId);
    const updateData: any = { status };
    if (status === 'active') {
        updateData.startTime = serverTimestamp();
    } else if (status === 'ended') {
        updateData.endTime = serverTimestamp();
    }
    updateDocumentNonBlocking(sessionRef, updateData);
    toast({
        title: `Session ${status === 'active' ? 'Started' : 'Ended'}`,
        description: `The session has been successfully updated.`,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Create Attendance Session
          </CardTitle>
          <CardDescription>
            Create a new session that students can join to mark their attendance.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science - Lecture 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isUserLoading || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Session
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>
            A list of attendance sessions you have created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.title}</TableCell>
                    <TableCell>
                        <Badge variant={session.status === 'active' ? 'default' : session.status === 'ended' ? 'destructive' : 'secondary'}>
                            {session.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {session.status !== 'active' && (
                            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(session.id, 'active')}>
                                <Play className="mr-2 h-4 w-4" /> Start
                            </Button>
                        )}
                        {session.status === 'active' && (
                             <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(session.id, 'ended')}>
                                <Square className="mr-2 h-4 w-4" /> End
                            </Button>
                        )}
                        <Button asChild variant="secondary" size="sm">
                            <Link href={`/dashboard/teacher/attendance/${session.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              You have not created any sessions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
