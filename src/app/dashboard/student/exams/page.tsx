'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, FilePlus } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function ExamsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const examFormsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'examForms'), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );
  const { data: submittedForms, isLoading: isLoadingForms } = useCollection(examFormsQuery);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'Approved') return 'Form Submitted Successfully';
    return status;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-6 w-6" />
            Examination Forms
          </CardTitle>
          <CardDescription>
            Register for your exams and track the status of your applications here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isUserLoading || isLoadingForms ? (
              <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
              </div>
          ) : submittedForms && submittedForms.length > 0 ? (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Exam Type</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead>Submitted On</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {submittedForms.map(form => (
                          <TableRow key={form.id}>
                              <TableCell className="capitalize">{form.examType}</TableCell>
                              <TableCell>{form.subjectsSelected.join(", ")}</TableCell>
                              <TableCell>{form.createdAt?.toDate().toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                  <Badge variant={getStatusVariant(form.approvalStatus)}>
                                      {getStatusText(form.approvalStatus)}
                                  </Badge>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          ) : (
              <p className="text-sm text-muted-foreground text-center py-6">You have not submitted any exam forms yet.</p>
          )}
        </CardContent>
        <CardFooter>
            <Button asChild>
                <Link href="/dashboard/student/exams/fill-form">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Fill New Exam Form
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
