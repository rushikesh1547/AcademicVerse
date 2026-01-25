'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil, Upload, User } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useFirebaseApp } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function TeacherProfilePage() {
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
  
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [openUploadPhotoDialog, setOpenUploadPhotoDialog] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !isUserDataLoading) {
      if (!user) {
        router.replace('/');
      } else if (userData && userData.role !== 'teacher') {
        router.replace('/dashboard');
      }
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    }
  }, [userData?.displayName]);

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

  const isLoading = isUserLoading || isUserDataLoading;
  
  if (isLoading || (userData && userData.role !== 'teacher')) {
    return (
      <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Teacher Profile</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-6 w-6" />Profile Information</CardTitle>
                <CardDescription>View and edit your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-start gap-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="grid gap-2 flex-1">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                </div>
            </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Teacher Profile</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Profile Information
          </CardTitle>
          <CardDescription>View and edit your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                {userData?.profileImageUrl ? (
                  <AvatarImage src={userData.profileImageUrl} alt="User Avatar" />
                ) : (
                  <AvatarFallback className="text-3xl">
                    {userData?.displayName?.charAt(0) || 'T'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid gap-1.5 flex-1">
                <h2 className="text-2xl font-bold font-headline">{userData?.displayName}</h2>
                <p className="text-muted-foreground capitalize">Role: {userData?.role}</p>
                <p className="text-muted-foreground">Email: {userData?.email}</p>
              </div>
              <div className="flex w-full md:w-auto flex-wrap gap-2 mt-4 md:mt-0">
                  <Button variant="outline" onClick={() => setOpenEditDialog(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Profile
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
    </>
  );
}
