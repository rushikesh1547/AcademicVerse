'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceSummary, assignments } from '@/lib/mock-data';
import { Download, User, Camera, Loader2, Pencil, CheckCircle } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ENROLLMENT_STEPS = ['Front View', 'Left Profile', 'Right Profile'];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for enrollment dialog
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  // State for edit dialog
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    }
  }, [userData?.displayName]);

  const startCamera = useCallback(async () => {
    if (videoRef.current && !videoRef.current.srcObject) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if(videoRef.current) videoRef.current.onloadedmetadata = resolve
          });
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: 'Could not access camera. Please check permissions.',
        });
        setOpenEnrollDialog(false);
      }
    }
  }, [toast]);
  
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraReady(false);
    }
  }, []);

  useEffect(() => {
    if (openEnrollDialog) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return stopCamera;
  }, [openEnrollDialog, startCamera, stopCamera]);


  const handleCapture = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    // Capture at a smaller resolution to keep data URI size manageable
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    setCapturedImages(prev => {
        const newImages = [...prev];
        newImages[enrollmentStep] = imageDataUrl;
        return newImages;
    });

    if (enrollmentStep < ENROLLMENT_STEPS.length - 1) {
        setEnrollmentStep(prev => prev + 1);
    }
  };

  const handleSaveEnrollment = async () => {
    if (!userDocRef || capturedImages.length < ENROLLMENT_STEPS.length) {
        toast({ title: "Error", description: "Please capture all required images.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    
    updateDocumentNonBlocking(userDocRef, { faceProfileImageUrls: capturedImages });

    toast({
        title: 'Face Enrollment Complete!',
        description: 'Your new profile photos have been saved.',
    });
    setIsSaving(false);
    resetEnrollment();
    setOpenEnrollDialog(false);
  };
  
  const resetEnrollment = () => {
    setEnrollmentStep(0);
    setCapturedImages([]);
  }

  const handleProfileUpdate = () => {
    if (!userDocRef || !displayName) return;
    updateDocumentNonBlocking(userDocRef, { displayName });
    toast({
        title: "Profile Updated",
        description: "Your display name has been changed."
    });
    setOpenEditDialog(false);
  }
  
  const isLoading = isUserLoading || isUserDataLoading;
  const isEnrolled = userData?.faceProfileImageUrls && userData.faceProfileImageUrls.length >= ENROLLMENT_STEPS.length;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Student Profile
          </CardTitle>
          <CardDescription>The single source of truth for your academic life.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="grid gap-2 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-5 w-72" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                {userData?.faceProfileImageUrls?.[0] && (
                  <AvatarImage src={userData.faceProfileImageUrls[0]} alt="User Avatar" />
                )}
                <AvatarFallback className="text-3xl">
                  {userData?.displayName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1.5 flex-1">
                <h2 className="text-2xl font-bold font-headline">{userData?.displayName}</h2>
                <p className="text-muted-foreground">Role: {userData?.role}</p>
                <p className="text-muted-foreground">Email: {userData?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isEnrolled ? "default" : "secondary"}>
                        {isEnrolled ? "Face Enrolled" : "Not Enrolled"}
                    </Badge>
                </div>
              </div>
              <div className="flex w-full md:w-auto gap-2 mt-4 md:mt-0">
                  <Button variant="outline" onClick={() => setOpenEditDialog(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="ml-auto" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download Grade Card
                  </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Profile Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                      Update your display name.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                          Name
                      </Label>
                      <Input
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="col-span-3"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                  <Button onClick={handleProfileUpdate}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* Face Enrollment Card & Dialog */}
      <Dialog open={openEnrollDialog} onOpenChange={setOpenEnrollDialog}>
        <Card>
            <CardHeader>
                <CardTitle>Face Recognition Enrollment</CardTitle>
                <CardDescription>
                    To use the smart attendance system, you must enroll your face by providing a few photos.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 items-center">
                {userData?.faceProfileImageUrls?.map((url, index) => (
                    <div key={index} className="relative aspect-square w-full max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden">
                       <Image src={url} alt={`Enrolled photo ${index + 1}`} layout="fill" objectFit="cover" />
                       <Badge className="absolute top-2 right-2">{ENROLLMENT_STEPS[index]}</Badge>
                    </div>
                )) || <p className="text-sm text-muted-foreground md:col-span-3 text-center">No face enrollment photos found.</p>}
            </CardContent>
            <CardFooter>
                 <DialogTrigger asChild>
                    <Button>
                      <Camera className="mr-2 h-4 w-4" />
                      {isEnrolled ? "Update Enrollment" : "Start Face Enrollment"}
                    </Button>
                 </DialogTrigger>
            </CardFooter>
        </Card>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Face Enrollment: {ENROLLMENT_STEPS[enrollmentStep]}</DialogTitle>
                <DialogDescription>
                    Please position your face as requested and capture the image.
                </DialogDescription>
            </DialogHeader>
            <Progress value={((enrollmentStep + 1) / ENROLLMENT_STEPS.length) * 100} className="w-full" />
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {!isCameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 justify-center">
                    {ENROLLMENT_STEPS.map((step, index) => (
                        <div key={step} className="flex items-center gap-2 text-sm">
                            {capturedImages[index] ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border" />}
                            <span className={enrollmentStep === index ? 'font-bold' : ''}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary" onClick={resetEnrollment}>Cancel</Button>
                </DialogClose>
                {enrollmentStep < ENROLLMENT_STEPS.length -1 ? (
                    <Button onClick={handleCapture} disabled={!isCameraReady || !capturedImages[enrollmentStep]}>
                       <Camera className="mr-2 h-4 w-4" /> Next Step
                    </Button>
                ) : (
                     <Button onClick={handleSaveEnrollment} disabled={!isCameraReady || isSaving || !capturedImages[enrollmentStep]}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Complete & Save
                    </Button>
                )}
                 <Button onClick={handleCapture} disabled={!isCameraReady}>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceSummary.map((item, index) => {
                  const percentage = (item.attended / item.total) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell>{item.subject}</TableCell>
                      <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell className="text-right">{item.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
