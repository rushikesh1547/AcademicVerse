'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { BookOpen, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";

export default function ResourcesPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const resourcesQuery = useMemoFirebase(() => 
    userData?.branch && userData?.currentYear
      ? query(
          collection(firestore, 'resources'),
          where('branch', '==', userData.branch),
          where('currentYear', '==', userData.currentYear)
        )
      : null,
    [firestore, userData]
  );
  const { data: resources, isLoading: isLoadingResources } = useCollection(resourcesQuery);

  const isLoading = isUserDataLoading || isLoadingResources;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Resources
        </CardTitle>
        <CardDescription>
          Access academic materials for your branch and year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>
        ) : resources && resources.length > 0 ? (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {resources.map((resource) => (
                <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell>{resource.subject}</TableCell>
                    <TableCell>{resource.teacherName}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={resource.fileUrl || '#'}>
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
            <p className="text-sm text-muted-foreground text-center py-6">
                No resources have been uploaded for your branch and year yet.
            </p>
        )}
      </CardContent>
    </Card>
  )
}
