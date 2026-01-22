'use client';

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
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, Eye, Check, X } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ExamApprovalsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pendingFormsQuery = useMemoFirebase(
    () => query(collection(firestore, 'examForms'), where('approvalStatus', '==', 'Pending'), orderBy('createdAt', 'asc')),
    [firestore]
  );
  const { data: pendingForms, isLoading } = useCollection(pendingFormsQuery);

  const handleUpdateStatus = (formId: string, status: 'Approved' | 'Rejected') => {
    const formRef = doc(firestore, 'examForms', formId);
    updateDocumentNonBlocking(formRef, { approvalStatus: status });
    toast({
        title: `Form ${status}`,
        description: `The exam form has been ${status.toLowerCase()}.`
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          Exam Form Approvals
        </CardTitle>
        <CardDescription>
          Review and approve pending examination forms submitted by students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingForms && pendingForms.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingForms.map(form => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.studentName}</TableCell>
                  <TableCell className="capitalize">{form.examType}</TableCell>
                  <TableCell>{form.createdAt?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                        <Link href={form.feeReceiptUrl} target="_blank">
                            <Eye className="mr-2 h-4 w-4" /> View
                        </Link>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => handleUpdateStatus(form.id, 'Approved')}>
                        <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                     <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(form.id, 'Rejected')}>
                        <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            There are no pending exam forms to review.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
