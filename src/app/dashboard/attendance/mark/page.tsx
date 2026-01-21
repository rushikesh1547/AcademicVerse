"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CheckCircle, Info, Loader2, XCircle } from 'lucide-react';
import { verifyStudentFace, FaceVerificationOutput } from '@/ai/ai-face-verification';
import { useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function MarkAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationOutput | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleMarkAttendance = async () => {
    if (!videoRef.current || !user || !userData) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Camera not ready or user data not loaded.",
        });
        return;
    }
    if (!userData.profilePhotoUrl) {
        toast({
            variant: "destructive",
            title: "Profile Photo Missing",
            description: "Please set your profile photo on the profile page before marking attendance.",
        });
        return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');
    
    const VERIFICATION_THRESHOLD = 0.8; // 80% confidence required

    try {
        const result = await verifyStudentFace({
            capturedPhotoDataUri,
            referencePhotoUrl: userData.profilePhotoUrl,
        });
        setVerificationResult(result);

        if (result.isVerified && result.confidence >= VERIFICATION_THRESHOLD) {
            toast({
                title: 'Verification Successful!',
                description: `Confidence: ${(result.confidence * 100).toFixed(2)}%. Attendance marked.`,
            });
            const sessionId = 'live-session-1'; // Hardcoded for demonstration
            const attendanceCollectionRef = collection(firestore, 'attendanceSessions', sessionId, 'attendanceIntervals');
            addDocumentNonBlocking(attendanceCollectionRef, {
                sessionId,
                studentId: user.uid,
                timestamp: serverTimestamp(),
                presenceStatus: true,
                faceRecognitionData: `Verified with ${(result.confidence * 100).toFixed(2)}% confidence`,
            });
        } else {
            let description = result.reason || 'Could not verify your identity.';
            if (result.isVerified && result.confidence < VERIFICATION_THRESHOLD) {
                description = `Confidence score of ${(result.confidence * 100).toFixed(2)}% is too low. Please try again in better lighting.`;
            }
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: description,
            });
        }
    } catch (error: any) {
        console.error("Error verifying face:", error);
        let toastTitle = 'Verification Error';
        let toastDescription = 'An unexpected error occurred during face verification.';
        if (error?.message?.includes('API key was reported as leaked')) {
            toastTitle = 'API Key Error';
            toastDescription = 'Your API key has been leaked and disabled. Please generate a new one and update it in your .env file.';
        }
        toast({
            variant: 'destructive',
            title: toastTitle,
            description: toastDescription,
        });
    } finally {
        setIsVerifying(false);
    }
  };

  const getButtonState = () => {
    if (isUserLoading || isUserDataLoading) {
      return { disabled: true, text: 'Loading User Data...' };
    }
    if (isVerifying) {
      return { disabled: true, text: 'Verifying...' };
    }
    if (hasCameraPermission === null) {
      return { disabled: true, text: 'Requesting Camera...' };
    }
    if (!hasCameraPermission) {
      return { disabled: true, text: 'Camera Disabled' };
    }
    if (!userData?.profilePhotoUrl) {
      return { disabled: true, text: 'Set Profile Photo First' };
    }
    return { disabled: false, text: 'Mark My Attendance' };
  };

  const buttonState = getButtonState();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Mark Attendance
        </CardTitle>
        <CardDescription>
          Center your face in the camera view and click the button to mark your attendance. This session is being proctored by AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="w-full max-w-md aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {isVerifying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
            )}
        </div>
        {hasCameraPermission === false && (
          <Alert variant="destructive" className="w-full max-w-md">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser to use this feature. You may need to refresh the page after granting permission.
            </AlertDescription>
          </Alert>
        )}
        {!isUserDataLoading && !userData?.profilePhotoUrl && (
            <Alert className="w-full max-w-md">
                <Info className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                    You need to set a profile photo before you can mark your attendance.
                    <Button asChild variant="link" className="p-1 h-auto">
                        <Link href="/dashboard/profile">Go to Profile Page</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )}
        <Button onClick={handleMarkAttendance} disabled={buttonState.disabled}>
          {isVerifying || isUserLoading || isUserDataLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {buttonState.text}
        </Button>
      </CardContent>
    </Card>
    <Card>
        <CardHeader>
            <CardTitle>Verification Result</CardTitle>
            <CardDescription>Result from the AI face verification system.</CardDescription>
        </CardHeader>
        <CardContent>
            {!verificationResult && !isVerifying && <p className="text-sm text-muted-foreground">Click the button to start verification.</p>}
            {isVerifying && <p className="text-sm text-muted-foreground">Verification in progress...</p>}
            {verificationResult && (
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Status:</h3>
                        <Badge variant={verificationResult.isVerified && verificationResult.confidence >= 0.8 ? "default" : "destructive"} className="gap-1.5 pl-1.5">
                            {verificationResult.isVerified && verificationResult.confidence >= 0.8 ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {verificationResult.isVerified && verificationResult.confidence >= 0.8 ? "Verified" : "Not Verified"}
                        </Badge>
                    </div>
                     <div>
                        <h3 className="font-semibold">Confidence Score:</h3>
                        <p className="text-sm font-mono text-muted-foreground">{`${(verificationResult.confidence * 100).toFixed(2)}%`}</p>
                     </div>
                     <div>
                        <h3 className="font-semibold">AI Reason:</h3>
                        <p className="text-sm text-muted-foreground">{verificationResult.reason}</p>
                     </div>
                </div>
            )}
        </CardContent>
    </Card>
    </div>
  );
}
