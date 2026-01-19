'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceSummary, assignments } from '@/lib/mock-data';
import { Download, User, Camera, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // This effect handles the camera lifecycle based on the dialog's `open` state.
    if (open) {
      let stream: MediaStream | null = null;
      const setupCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setIsCameraReady(true);
            };
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          toast({
            variant: 'destructive',
            title: 'Camera Error',
            description: 'Could not access camera. Please check permissions.',
          });
          setOpen(false);
        }
      };

      setupCamera();

      // Cleanup function: This will be called when the dialog closes
      // or when the component unmounts.
      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
      };
    }
  }, [open, toast, setOpen]);


  const handleCaptureAndSave = async () => {
    if (!videoRef.current || !userDocRef) return;
    setIsSaving(true);
    
    // In a real app, you would upload this to Firebase Storage and get a URL.
    // For this prototype, we'll just save a new placeholder image URL to simulate the update.
    const newProfileImage = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');
    if (!newProfileImage) {
        toast({ title: "Error", description: "Placeholder image not found", variant: "destructive" });
        setIsSaving(false);
        return;
    }
    
    updateDocumentNonBlocking(userDocRef, { profilePhotoUrl: newProfileImage.imageUrl });

    // Simulate save time
    setTimeout(() => {
        toast({
            title: 'Profile Photo Updated!',
            description: 'Your new photo has been saved.',
        });
        setIsSaving(false);
        setOpen(false);
    }, 1000);
  };
  
  const isLoading = isUserLoading || isUserDataLoading;

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
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                {userData?.profilePhotoUrl && (
                  <AvatarImage src={userData.profilePhotoUrl} alt="User Avatar" />
                )}
                <AvatarFallback className="text-3xl">
                  {userData?.displayName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-2">
                <h2 className="text-2xl font-bold font-headline">{userData?.displayName}</h2>
                <p className="text-muted-foreground">Role: {userData?.role}</p>
                <p className="text-muted-foreground">Email: {userData?.email}</p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Update Profile Photo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile Photo</DialogTitle>
                      <DialogDescription>
                        Center your face in the camera view and capture a new photo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {!isCameraReady && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button onClick={handleCaptureAndSave} disabled={!isCameraReady || isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Capture & Save'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Grade Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
