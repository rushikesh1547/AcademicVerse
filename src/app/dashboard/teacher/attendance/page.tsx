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
import { Loader2, Camera, Eye, BarChart3, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
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
  DialogClose,
} from '@/components/ui/dialog';
import { scanClassroom } from '@/ai/ai-classroom-scanner';

const subjects = [
    'Computer Science - Lecture 1',
    'Data Structures - Lab',
    'Algorithms - Tutorial',
    'Operating Systems - Lecture',
    'Database Systems - Lab'
];

const SNAPSHOT_COUNT = 4;

function StartAttendanceScanDialog({ subject, user }: { subject: string, user: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionData, setSessionData] = useState<{ id: string, title: string } | null>(null);
    const [snapshotStep, setSnapshotStep] = useState(0);
    const [intervalResults, setIntervalResults] = useState<string[][]>([]);
    
    const firestore = useFirestore();
    const { toast } = useToast();

    const studentsQuery = useMemoFirebase(
        () => query(collection(firestore, 'users'), where('role', '==', 'student')),
        [firestore]
    );
    const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);

    const resetState = () => {
        setSessionData(null);
        setSnapshotStep(0);
        setIntervalResults([]);
        setIsProcessing(false);
    };

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
            setIsOpen(false);
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
            resetState();
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

    const handleStartSession = async () => {
        if (!user) return;
        setIsProcessing(true);
        const sessionTitle = `${subject} - ${new Date().toLocaleDateString()}`;
        try {
            const sessionDocData = {
                title: sessionTitle,
                teacherId: user.uid,
                status: 'active',
                startTime: serverTimestamp(),
                endTime: null,
                presentStudentIds: [],
            };
            const docRef = await addDoc(collection(firestore, 'attendanceSessions'), sessionDocData);
            setSessionData({ id: docRef.id, title: sessionTitle });
            setSnapshotStep(1);
            toast({
                title: 'Session Started',
                description: `Session "${sessionTitle}" is now active.`,
            });
        } catch (e) {
            console.error("Error creating session:", e);
            toast({
                variant: "destructive",
                title: "Session Error",
                description: "Could not create a new attendance session.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTakeSnapshot = async () => {
        if (!videoRef.current || !students || !sessionData) {
            toast({ variant: "destructive", title: "Error", description: "Camera is not ready, students not loaded, or session not started." });
            return;
        }
        setIsProcessing(true);

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

            const result = await scanClassroom({ classroomPhotoDataUri, students: studentDataForAI });
            
            setIntervalResults(prev => [...prev, result.identifiedStudentIds]);
            setSnapshotStep(prev => prev + 1);

            toast({
                title: `Snapshot ${snapshotStep} Complete`,
                description: `Identified ${result.identifiedStudentIds.length} students.`,
            });
        } catch (error) {
            console.error("Error scanning classroom:", error);
            toast({ variant: "destructive", title: "AI Scan Error", description: "An unexpected error occurred during the scan." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalize = async () => {
        if (!sessionData) return;
        setIsProcessing(true);

        // Find students present in all snapshots (intersection of all arrays)
        const finalPresentIds = intervalResults.reduce((acc, current) => {
            const currentSet = new Set(current);
            return acc.filter(id => currentSet.has(id));
        }, intervalResults[0] || []);
        
        const finalPresentIdsSet = new Set(finalPresentIds);
        
        const sessionDocRef = doc(firestore, 'attendanceSessions', sessionData.id);
        updateDocumentNonBlocking(sessionDocRef, { 
            presentStudentIds: Array.from(finalPresentIdsSet),
            status: 'ended',
            endTime: serverTimestamp()
        });

        toast({
            title: "Attendance Finalized",
            description: `Marked ${finalPresentIdsSet.size} students as fully present.`
        });
        setIsProcessing(false);
        setIsOpen(false);
    };
    
    const renderContent = () => {
        if (!sessionData) {
            return (
                <DialogFooter>
                    <Button onClick={handleStartSession} disabled={isProcessing || isLoadingStudents}>
                        {(isProcessing || isLoadingStudents) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoadingStudents ? 'Loading Student Data...' : 'Start 1-Hour Session'}
                    </Button>
                </DialogFooter>
            );
        }

        if (snapshotStep <= SNAPSHOT_COUNT) {
            return (
                <>
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            {!stream && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground absolute" />}
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Interval Snapshots</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Take {SNAPSHOT_COUNT} snapshots during the lecture. Only students present in all snapshots will be marked present.
                            </p>
                            <Progress value={(snapshotStep - 1) / SNAPSHOT_COUNT * 100} className="mb-4" />
                            <div className="space-y-2">
                                {Array.from({ length: SNAPSHOT_COUNT }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        {i < intervalResults.length ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border" />}
                                        <span>Snapshot {i + 1}</span>
                                        {i < intervalResults.length && <span className="text-xs text-muted-foreground">({intervalResults[i].length} students)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleTakeSnapshot} disabled={isProcessing || !stream}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Take Snapshot {snapshotStep} of {SNAPSHOT_COUNT}
                        </Button>
                    </DialogFooter>
                </>
            );
        }

        return (
             <DialogFooter>
                <Button onClick={handleFinalize} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finalize & Save Attendance
                </Button>
            </DialogFooter>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Session
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Attendance Session: {subject}</DialogTitle>
                    <DialogDescription>
                        {sessionData ? `Session ID: ${sessionData.id}` : 'Start a new 1-hour attendance session.'}
                    </DialogDescription>
                </DialogHeader>
                {renderContent()}
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
                        Select a subject to begin a new interval-based attendance session.
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
                                <Badge variant={session.status === 'active' ? 'default' : session.status === 'ended' ? 'secondary' : 'outline'}>
                                    {session.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/teacher/attendance/${session.id}`}>
                                        <Eye className="mr-2 h-4 w-4" /> View Report
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

    