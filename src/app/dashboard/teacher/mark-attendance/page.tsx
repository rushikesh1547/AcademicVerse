'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useDoc,
  useMemoFirebase,
  addDocumentNonBlocking,
  useCollection,
} from '@/firebase';
import { doc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { verifyStudentFace } from '@/ai/ai-face-verification';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, CheckCircle } from 'lucide-react';

export default function MarkTeacherAttendancePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const { today, tomorrow } = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const tm = new Date(t);
    tm.setDate(tm.getDate() + 1);
    return { today: t, tomorrow: tm };
  }, []);

  const attendanceQuery = useMemoFirebase(
    () => !isUserLoading && user ? query(
      collection(firestore, `users/${user.uid}/teacherAttendance`),
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow)
    ) : null,
    [user, isUserLoading, firestore, today, tomorrow]
  );
  const { data: todaysAttendance, isLoading: isLoadingAttendance } = useCollection(attendanceQuery);

  const hasMarkedToday = todaysAttendance && todaysAttendance.length > 0;

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [toast]);


  const handleMarkAttendance = async () => {
    if (!videoRef.current || !userData?.profileImageUrl) {
        toast({
            variant: "destructive",
            title: "Cannot Mark Attendance",
            description: "Reference profile image not found or camera is not ready."
        });
        return;
    }
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');

    try {
        const result = await verifyStudentFace({
            capturedPhotoDataUri,
            referencePhotoUrls: [userData.profileImageUrl]
        });

        if (result.isVerified) {
            if (user) {
                addDocumentNonBlocking(collection(firestore, `users/${user.uid}/teacherAttendance`), {
                    teacherId: user.uid,
                    timestamp: serverTimestamp()
                });
                toast({
                    title: "Attendance Marked!",
                    description: `You have been marked present for today.`,
                    className: 'bg-green-100 dark:bg-green-900',
                });
            }
        } else {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: result.reason || "Could not verify your identity. Please try again."
            });
        }
    } catch (error) {
        console.error("Error during verification:", error);
        toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Something went wrong during the verification process."
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isUserLoading || isUserDataLoading || isLoadingAttendance;
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-6 w-6" />
          Mark Daily Attendance
        </CardTitle>
        <CardDescription>
          Capture a photo of yourself to mark your attendance for today.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {hasCameraPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          )}
        </div>
        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
              This feature requires camera access. Please enable it in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}
        {isLoading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
        {!isLoading && hasMarkedToday && (
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-300">Attendance Marked</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                    You have already marked your attendance today at {todaysAttendance[0].timestamp.toDate().toLocaleTimeString()}.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
            onClick={handleMarkAttendance} 
            disabled={isProcessing || !hasCameraPermission || !!hasMarkedToday || isLoading}
            className="w-full"
            size="lg"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? 'Verifying...' : 'Mark Me Present'}
        </Button>
      </CardFooter>
    </Card>
  );
}
