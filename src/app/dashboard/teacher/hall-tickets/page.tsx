'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Loader2, Ticket, Upload } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useFirebaseApp, addDocumentNonBlocking, useUser, useDoc } from "@/firebase";
import { collection, query, where, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";

function UploadHallTicketDialog({ form }: { form: any }) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const firebaseApp = useFirebaseApp();
    const firestore = useFirestore();
    const storage = getStorage(firebaseApp);
    const { toast } = useToast();

    const handleUpload = async () => {
        if (!file) {
            toast({ variant: 'destructive', title: 'No file selected' });
            return;
        }

        setIsUploading(true);

        try {
            const storageRef = ref(storage, `hall-tickets/${form.studentId}/${Date.now()}-${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const hallTicketUrl = await getDownloadURL(snapshot.ref);

            await addDocumentNonBlocking(collection(firestore, 'users', form.studentId, 'hallTickets'), {
                studentId: form.studentId,
                studentName: form.studentName,
                examFormId: form.id,
                examType: form.examType,
                hallTicketUrl,
                uploadedAt: serverTimestamp(),
            });

            toast({
                title: 'Hall Ticket Uploaded!',
                description: `A hall ticket has been uploaded for ${form.studentName}.`
            });
            document.getElementById(`close-dialog-${form.id}`)?.click();

        } catch (error) {
            console.error("Error uploading hall ticket:", error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'There was an error uploading the hall ticket.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Upload Hall Ticket
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Hall Ticket for {form.studentName}</DialogTitle>
                    <DialogDescription>
                        Select the generated hall ticket file to upload. The student will be able to download it immediately.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="hall-ticket-file">Hall Ticket File</Label>
                    <Input id="hall-ticket-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button id={`close-dialog-${form.id}`} variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload and Notify
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function HallTicketsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserDataLoading && (!userData || userData.role !== 'teacher')) {
      router.replace('/dashboard');
    }
  }, [userData, isUserDataLoading, router]);

  const approvedFormsQuery = useMemoFirebase(
    () => (userData?.role === 'teacher')
      ? query(collection(firestore, 'examForms'), where('approvalStatus', '==', 'Approved'), orderBy('createdAt', 'desc'))
      : null,
    [firestore, userData]
  );
  const { data: approvedForms, isLoading: isLoadingForms } = useCollection(approvedFormsQuery);

  if (isUserDataLoading || !userData || userData.role !== 'teacher') {
    return (
        <div className="flex w-full h-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          Hall Ticket Management
        </CardTitle>
        <CardDescription>
          Upload hall tickets for students with approved examination forms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingForms ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : approvedForms && approvedForms.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedForms.map(form => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.studentName}</TableCell>
                  <TableCell className="capitalize">{form.examType}</TableCell>
                  <TableCell>{form.subjectsSelected.join(', ')}</TableCell>
                  <TableCell className="text-right">
                     <UploadHallTicketDialog form={form} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            There are no approved exam forms ready for hall ticket generation.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
