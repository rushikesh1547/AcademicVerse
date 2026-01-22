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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function ResourcesPage() {
  const firestore = useFirestore();
  const resourcesQuery = useMemoFirebase(() => collection(firestore, 'resources'), [firestore]);
  const { data: resources, isLoading } = useCollection(resourcesQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Resources
        </CardTitle>
        <CardDescription>
          Access academic materials shared by your teachers.
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
                    <TableCell>{resource.uploader}</TableCell>
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
                No resources have been uploaded yet. Check back later.
            </p>
        )}
      </CardContent>
    </Card>
  )
}
