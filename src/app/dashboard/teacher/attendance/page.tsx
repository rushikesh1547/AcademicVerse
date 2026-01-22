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
import { Loader2, BarChart3, Play, Square, Eye, Camera } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { scanClassroom } from '@/ai/ai-classroom-scanner';
import { useRef, useState, useCallback } from 'react';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
});


// New Component for Camera Attendance
function CameraAttendanceDialog({ session }: { session: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanResults, setLastScanResults] = useState<string[] | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    const studentsQuery = useMemoFirebase(
        () => query(collection(firestore, 'users'), where('role', '==', 'student')),
        [firestore]
    );
    const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);

    const startStream = useCallback(async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'Could not access camera. Please check permissions.',
            });
        }
    }, [toast]);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const handleScan = async () => {
        if (!videoRef.current || !students || students.length === 0) {
            toast({
                variant: "destructive",
                title: "Scan Error",
                description: "Camera is not ready or there are no students to scan for.",
            });
            return;
        }

        setIsScanning(true);
        setLastScanResults(null);

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const classroomPhotoDataUri = canvas.toDataURL('image/jpeg');

        try {
            const studentDataForAI = students.map(s => ({
                id: s.id,
                displayName: s.displayName,
                faceProfileImageUrls: s.faceProfileImageUrls || [],
            })).filter(s => s.faceProfileImageUrls.length > 0);

            const result = await scanClassroom({
                classroomPhotoDataUri,
                students: studentDataForAI,
            });

            if (result.identifiedStudentIds.length > 0) {
                const identifiedNames: string[] = [];
                const attendanceCollectionRef = collection(firestore, 'attendanceSessions', session.id, 'attendanceIntervals');
                
                for (const studentId of result.identifiedStudentIds) {
                    const student = students.find(s => s.id === studentId);
                    if (student) {
                        identifiedNames.push(student.displayName);
                        addDocumentNonBlocking(attendanceCollectionRef, {
                            sessionId: session.id,
                            studentId: student.id,
                            studentName: student.displayName,
                            timestamp: serverTimestamp(),
                            presenceStatus: true,
                            faceRecognitionData: `Verified by teacher scan`,
                        });
                    }
                }
                setLastScanResults(identifiedNames);
                toast({
                    title: "Scan Complete",
                    description: `Marked ${identifiedNames.length} students present: ${identifiedNames.join(', ')}`,
                });

            } else {
                 setLastScanResults([]);
                 toast({
                    title: "Scan Complete",
                    description: "No students were identified in the photo.",
                });
            }
        } catch (error) {
            console.error("Error scanning classroom:", error);
            toast({
                variant: "destructive",
                title: "AI Scan Error",
                description: "An unexpected error occurred during the classroom scan.",
            });
        } finally {
            setIsScanning(false);
        }
    };
    
    return (
        <Dialog onOpenChange={(open) => {
            if (open) startStream();
            else stopStream();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Mark with Camera
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Mark Attendance for: {session.title}</DialogTitle>
                    <DialogDescription>
                        Position the camera to see your students and click "Scan Classroom". The AI will detect and mark them present.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {!stream && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground absolute" />}
                        {isScanning && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                <Loader2 className="h-12 w-12 animate-spin" />
                                <p className="mt-2">Scanning classroom...</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Last Scan Results</h3>
                        {lastScanResults ? (
                            lastScanResults.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                    {lastScanResults.map((name, i) => <li key={i}>{name}</li>)}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No students were identified.</p>
                            )
                        ) : (
                            <p className="text-sm text-muted-foreground">Results will appear here after a scan.</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleScan} disabled={isScanning || isLoadingStudents || !stream}>
                        {(isScanning || isLoadingStudents) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoadingStudents ? 'Loading students...' : 'Scan Classroom'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


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
                        {session.status === 'active' && <CameraAttendanceDialog session={session} />}
                        {session.status !== 'active' && session.status !== 'ended' && (
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
