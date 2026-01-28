'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Download, User, Camera, Loader2, Pencil, CheckCircle, Upload, FileUp, Eye } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useFirebaseApp } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { detectFaces } from '@/ai/ai-face-detection';

const ENROLLMENT_STEPS = ['Front View', 'Left Profile', 'Right Profile'];

const profileFormSchema = z.object({
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  aadharNumber: z.string().length(12, { message: "Aadhar number must be 12 digits."}).optional().or(z.literal('')),
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  panCard: z.string().optional(),
});

type DocumentType = 'collegeIdCardUrl' | 'casteCertificateUrl' | 'casteValidityUrl' | 'capOrManagementCertificateUrl' | 'pwdCertificateUrl' | 'panCardUrl';

const documentsToUpload: { docType: DocumentType; docName: string }[] = [
    { docType: 'collegeIdCardUrl', docName: 'College ID Card' },
    { docType: 'casteCertificateUrl', docName: 'Caste Certificate' },
    { docType: 'casteValidityUrl', docName: 'Caste Validity Certificate' },
    { docType: 'capOrManagementCertificateUrl', docName: 'CAP/Management Certificate' },
    { docType: 'pwdCertificateUrl', docName: 'PWD Certificate (if applicable)' },
    { docType: 'panCardUrl', docName: 'PAN Card' },
];

function UploadDocumentDialog({ userId, docType, docName, currentUrl }: { userId: string, docType: DocumentType, docName: string, currentUrl?: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const firebaseApp = useFirebaseApp();
    const userDocRef = doc(useFirestore(), 'users', userId);

    const handleUpload = async () => {
        if (!file) {
            toast({ title: "No file selected", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `documents/${userId}/${docType}/${file.name}`);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await updateDocumentNonBlocking(userDocRef, { [docType]: downloadURL });
            
            toast({ title: "Upload Successful!", description: `${docName} has been uploaded.` });
            document.getElementById(`close-dialog-${docType}`)?.click();
        } catch (error) {
            console.error("Error uploading document:", error);
            toast({ title: "Upload Failed", description: "There was an error uploading your document.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><FileUp className="mr-2 h-4 w-4" />Upload</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload {docName}</DialogTitle>
                    <DialogDescription>Select a file to upload. This will replace any existing file.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="doc-file">Document File</Label>
                    <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    {currentUrl && <p className="text-xs text-muted-foreground">An existing file will be overwritten.</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button id={`close-dialog-${docType}`} variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload File
                    </Button>
                </DialogFooter>
            </DialogContent>
    );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
        currentAddress: '',
        permanentAddress: '',
        aadharNumber: '',
        fatherName: '',
        fatherOccupation: '',
        motherName: '',
        motherOccupation: '',
        panCard: '',
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        currentAddress: userData.currentAddress || '',
        permanentAddress: userData.permanentAddress || '',
        aadharNumber: userData.aadharNumber || '',
        fatherName: userData.fatherName || '',
        fatherOccupation: userData.fatherOccupation || '',
        motherName: userData.motherName || '',
        motherOccupation: userData.motherOccupation || '',
        panCard: userData.panCardUrl ? 'Uploaded' : '', // Simplified for form state
      });
    }
  }, [userData, form]);


  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [openUploadPhotoDialog, setOpenUploadPhotoDialog] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !isUserDataLoading) {
      if (!user) {
        router.replace('/');
      } else if (userData && userData.role !== 'student') {
        router.replace('/dashboard');
      }
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    }
  }, [userData?.displayName]);

  const startStream = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(newStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions and try again.',
      });
      setOpenEnrollDialog(false);
    }
  }, [toast, setOpenEnrollDialog]);

  const stopStream = useCallback(() => {
    setStream(currentStream => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (openEnrollDialog) {
      startStream();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [openEnrollDialog, startStream, stopStream]);

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


  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
        const detectionResult = await detectFaces({ photoDataUri: imageDataUrl });

        if (detectionResult.faceCount === 1) {
            setCapturedImages(prev => {
                const newImages = [...prev];
                newImages[enrollmentStep] = imageDataUrl;
                return newImages;
            });
            toast({
                title: "Image Captured!",
                description: "Ready for the next step.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Capture Failed",
                description: detectionResult.reason || "Could not capture image. Please ensure only one face is clearly visible."
            });
        }
    } catch (error) {
        console.error("Error detecting face:", error);
        toast({
            variant: "destructive",
            title: "Capture Error",
            description: "An unexpected error occurred during face detection."
        });
    } finally {
        setIsCapturing(false);
    }
  };

  const handleSaveEnrollment = async () => {
    if (!userDocRef || capturedImages.filter(Boolean).length < ENROLLMENT_STEPS.length) {
        toast({ title: "Error", description: "Please capture all required images.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    
    updateDocumentNonBlocking(userDocRef, { faceProfileImageUrls: capturedImages });

    toast({
        title: 'Face Enrollment Complete!',
        description: 'Your new verification photos have been saved.',
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

  const handleProfilePhotoUpload = async () => {
    if (!profilePhotoFile || !user || !userDocRef) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }

    setIsUploadingPhoto(true);
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `profile-photos/${user.uid}`);

    try {
      const snapshot = await uploadBytes(storageRef, profilePhotoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      updateDocumentNonBlocking(userDocRef, { profileImageUrl: downloadURL });

      toast({
        title: "Profile Photo Updated!",
        description: "Your new photo is now live.",
      });
      setOpenUploadPhotoDialog(false);
      setProfilePhotoFile(null);
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  async function onInfoSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userDocRef) return;

    setIsSaving(true);
    try {
      await updateDocumentNonBlocking(userDocRef, values);
      toast({
        title: "Profile Saved",
        description: "Your detailed information has been updated.",
      });
    } catch (error) {
      console.error("Error updating profile details:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There was an error saving your information.",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  const isLoading = isUserLoading || isUserDataLoading;
  const isEnrolled = userData?.faceProfileImageUrls && userData.faceProfileImageUrls.length >= ENROLLMENT_STEPS.length;

  if (isLoading) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-6 w-6" />Student Profile</CardTitle>
                    <CardDescription>The single source of truth for your academic life.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="grid gap-2 flex-1">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-64" />
                            <Skeleton className="h-5 w-72" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

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
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                {userData?.profileImageUrl ? (
                  <AvatarImage src={userData.profileImageUrl} alt="User Avatar" />
                ) : (
                  <AvatarFallback className="text-3xl">
                    {userData?.displayName?.charAt(0) || 'S'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid gap-1.5 flex-1">
                <h2 className="text-2xl font-bold font-headline">{userData?.displayName}</h2>
                <p className="text-muted-foreground capitalize">Role: {userData?.role}</p>
                <p className="text-muted-foreground">Email: {userData?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isEnrolled ? "default" : "secondary"}>
                        {isEnrolled ? "Face Enrolled" : "Not Enrolled"}
                    </Badge>
                </div>
              </div>
              <div className="flex w-full md:w-auto flex-wrap gap-2 mt-4 md:mt-0">
                  <Button variant="outline" onClick={() => setOpenEditDialog(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Name
                  </Button>
                   <Button variant="outline" onClick={() => setOpenUploadPhotoDialog(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                    </Button>
              </div>
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Display Name</DialogTitle>
                  <DialogDescription>
                      Update your display name. This will be shown across the platform.
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

      <Dialog open={openUploadPhotoDialog} onOpenChange={setOpenUploadPhotoDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Upload Profile Photo</DialogTitle>
                  <DialogDescription>
                      Choose a new photo for your profile. This will be visible across the platform.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <Label htmlFor="photo">New Photo</Label>
                  <Input id="photo" type="file" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} accept="image/png, image/jpeg" />
              </div>
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setOpenUploadPhotoDialog(false)}>Cancel</Button>
                  <Button onClick={handleProfilePhotoUpload} disabled={isUploadingPhoto}>
                      {isUploadingPhoto && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Photo
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={openEnrollDialog} onOpenChange={setOpenEnrollDialog}>
        <Card>
            <CardHeader>
                <CardTitle>Face Recognition Enrollment</CardTitle>
                <CardDescription>
                    To use the smart attendance system, you must enroll your face by providing a few photos for verification.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 items-center">
                {(userData?.faceProfileImageUrls?.length || 0) > 0 ? userData.faceProfileImageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square w-full max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden">
                       <Image src={url} alt={`Enrolled photo ${index + 1}`} fill objectFit="cover" />
                       <Badge className="absolute top-2 right-2">{ENROLLMENT_STEPS[index]}</Badge>
                    </div>
                )) : <p className="text-sm text-muted-foreground md:col-span-3 text-center">No face enrollment photos found.</p>}
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
            <Progress value={((capturedImages.filter(Boolean).length) / ENROLLMENT_STEPS.length) * 100} className="w-full" />
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {!stream && (
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
            <DialogFooter className="gap-2 sm:justify-between">
                <DialogClose asChild>
                  <Button variant="secondary" onClick={resetEnrollment}>Cancel</Button>
                </DialogClose>
                <div className='flex gap-2'>
                    <Button onClick={handleCapture} disabled={!stream || isCapturing}>
                        {isCapturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Camera className="mr-2 h-4 w-4" />}
                        Capture Image
                    </Button>
                    {enrollmentStep < ENROLLMENT_STEPS.length - 1 ? (
                        <Button onClick={() => setEnrollmentStep(step => step + 1)} disabled={!capturedImages[enrollmentStep]}>
                        Next Step
                        </Button>
                    ) : (
                        <Button onClick={handleSaveEnrollment} disabled={isSaving || !capturedImages[enrollmentStep]}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Complete & Save
                        </Button>
                    )}
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onInfoSubmit)}>
                <CardHeader>
                    <CardTitle>Detailed Information</CardTitle>
                    <CardDescription>
                        Provide your personal, parent, and identity details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-medium">Contact Information</legend>
                         <FormField
                            control={form.control}
                            name="currentAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Your current place of residence" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="permanentAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Permanent Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Your permanent home address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </fieldset>
                    <Separator />
                     <fieldset className="space-y-4">
                        <legend className="text-lg font-medium">Identity Information</legend>
                        <FormField
                            control={form.control}
                            name="aadharNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aadhar Number</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter 12-digit Aadhar number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </fieldset>
                    <Separator />
                    <fieldset className="space-y-4">
                         <legend className="text-lg font-medium">Parent's Details</legend>
                         <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fatherName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Father's Name</FormLabel>
                                        <FormControl><Input placeholder="Father's full name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fatherOccupation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Father's Occupation</FormLabel>
                                        <FormControl><Input placeholder="Father's occupation" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>
                         <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="motherName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mother's Name</FormLabel>
                                        <FormControl><Input placeholder="Mother's full name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="motherOccupation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mother's Occupation</FormLabel>
                                        <FormControl><Input placeholder="Mother's occupation" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>
                    </fieldset>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Details
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Document Management</CardTitle>
            <CardDescription>Upload and manage your required documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {documentsToUpload.map(({ docType, docName }) => (
                <div key={docType} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="font-medium text-sm">{docName}</p>
                    <div className="flex items-center gap-2">
                         <Button asChild variant="outline" size="sm" disabled={!userData?.[docType]}>
                            <Link href={userData?.[docType] || '#'} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />View
                            </Link>
                        </Button>
                        {user && <UploadDocumentDialog userId={user.uid} docType={docType} docName={docName} currentUrl={userData?.[docType]} />}
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
