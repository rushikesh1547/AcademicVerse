'use client';

import Link from 'next/link';
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
import { Loader2, Ticket, Download } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function HallTicketPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const hallTicketsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'hallTickets'), orderBy('uploadedAt', 'desc')) : null,
    [user, firestore]
  );
  const { data: hallTickets, isLoading: isLoadingHallTickets } = useCollection(hallTicketsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          Hall Tickets
        </CardTitle>
        <CardDescription>
          Download your official hall tickets for upcoming examinations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUserLoading || isLoadingHallTickets ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hallTickets && hallTickets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Type</TableHead>
                <TableHead>Uploaded On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hallTickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell className="capitalize font-medium">{ticket.examType}</TableCell>
                  <TableCell>{ticket.uploadedAt?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline">
                      <Link href={ticket.hallTicketUrl} target="_blank">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            You have no hall tickets available for download yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
