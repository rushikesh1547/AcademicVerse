'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Eye, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, query, where, serverTimestamp, addDoc, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

const subjects = [
    'Computer Science - Lecture 1',
    'Data Structures - Lab',
    'Algorithms - Tutorial',
    'Operating Systems - Lecture',
    'Database Systems - Lab'
];

function StartAttendanceScanDialog({ subject, user }: { subject: string, user: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
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
        setStream(currentStream => {
            if (currentStream) {
              currentStream.getTracks().forEach(track => track.stop());
            }
            return null;
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            startStream();
        } else {
            stopStream();
        }
        return () => stopStream();
    }, [isOpen, startStream, stopStream]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement && stream) {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
                videoElement.play().catch(e => console.error("Video play failed", e));
            }
        } else if (videoElement) {
            videoElement.srcObject = null;
        }
    }, [stream]);

    const handleScanAndStartSession = async () => {
        if (!videoRef.current || !students || !user) {
            toast({
                variant: "destructive",
                title: "Scan Error",
                description: "Camera is not ready or student data could not be loaded.",
            });
            return;
        }

        setIsProcessing(true);
        setLastScanResults(null);

        // 1. Create the session document first
        const sessionTitle = `${subject} - ${new Date().toLocaleDateString()}`;
        let newSessionId = '';
        try {
            const sessionData = {
                title: sessionTitle,
                teacherId: user.uid,
                status: 'active', // Session is active immediately
                startTime: serverTimestamp(),
                endTime: null,
                presentStudentIds: [], // Initialize with an empty array
            };
            const docRef = await addDoc(collection(firestore, 'attendanceSessions'), sessionData);
            newSessionId = docRef.id;
            toast({
                title: 'Session Started',
                description: `Session "${sessionTitle}" is now active. Scanning for students...`,
            });
        } catch (e) {
            console.error("Error creating session:", e);
            toast({
                variant: "destructive",
                title: "Session Error",
                description: "Could not create a new attendance session.",
            });
            setIsProcessing(false);
            return;
        }

        // 2. Capture image
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const classroomPhotoDataUri = canvas.toDataURL('image/jpeg');

        // 3. Scan and Mark Attendance
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
                const attendanceCollectionRef = collection(firestore, 'attendanceSessions', newSessionId, 'attendanceIntervals');
                
                for (const studentId of result.identifiedStudentIds) {
                    const student = students.find(s => s.id === studentId);
                    if (student) {
                        identifiedNames.push(student.displayName);
                        // Using non-blocking adds for speed
                        addDocumentNonBlocking(attendanceCollectionRef, {
                            sessionId: newSessionId,
                            studentId: student.id,
                            studentName: student.displayName,
                            timestamp: serverTimestamp(),
                            presenceStatus: true,
                            faceRecognitionData: `Verified by teacher scan`,
                        });
                    }
                }
                
                // Update the session document with the array of present students
                const sessionDocRef = doc(firestore, 'attendanceSessions', newSessionId);
                updateDocumentNonBlocking(sessionDocRef, { presentStudentIds: result.identifiedStudentIds });
                
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
            setIsProcessing(false);
            setIsOpen(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Attendance
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Start Attendance Scan for: {subject}</DialogTitle>
                    <DialogDescription>
                        Position the camera to see your students, then click the scan button. A new session will be created automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {!stream && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground absolute" />}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                <Loader2 className="h-12 w-12 animate-spin" />
                                <p className="mt-2">Processing...</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Instructions</h3>
                        <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                            <li>Ensure good lighting in the classroom.</li>
                            <li>Ask students to face the camera.</li>
                            <li>Try to capture as many students as possible.</li>
                            <li>Click the scan button to log attendance.</li>
                        </ol>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleScanAndStartSession} disabled={isProcessing || isLoadingStudents || !stream}>
                        {(isProcessing || isLoadingStudents) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoadingStudents ? 'Loading Students...' : 'Scan Classroom & Start Session'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TeacherAttendancePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const sessionsQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(firestore, 'attendanceSessions'), where('teacherId', '==', user.uid))
        : null,
    [user, firestore]
  );
  const { data: sessions, isLoading: isLoadingSessions } = useCollection(sessionsQuery);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-6 w-6" />
                        Start New Attendance Session
                    </CardTitle>
                    <CardDescription>
                        Select a subject to start a new attendance scan. A new session will be created automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                    {subjects.map(subject => (
                        <div key={subject} className="flex items-center justify-between p-2 rounded-md border">
                            <p className="font-medium">{subject}</p>
                            <StartAttendanceScanDialog subject={subject} user={user} />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className="h-6 w-6" />
                    Past Sessions
                  </CardTitle>
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
