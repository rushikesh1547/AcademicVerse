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
import { Book, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function LessonPlanPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  // The query is only created once the user's auth state is fully loaded and confirmed.
  const lessonPlansQuery = useMemoFirebase(() => 
    !isUserLoading && user ? query(collection(firestore, 'lessonPlans'), orderBy('createdAt', 'desc')) : null,
    [firestore, user, isUserLoading]
  );
  const { data: lessonPlans, isLoading: isLoadingLessonPlans } = useCollection(lessonPlansQuery);

  // The overall loading state depends on both the user auth check and the data fetching.
  const isLoading = isUserLoading || isLoadingLessonPlans;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-6 w-6" />
          Lesson Plans
        </CardTitle>
        <CardDescription>
          Access lesson plans and academic materials shared by your teachers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>
        ) : lessonPlans && lessonPlans.length > 0 ? (
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
                {lessonPlans.map((plan) => (
                <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.title}</TableCell>
                    <TableCell>{plan.subject}</TableCell>
                    <TableCell>{plan.teacherName}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={plan.fileUrl || '#'} target='_blank'>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
                No lesson plans have been uploaded yet. Check back later.
            </p>
        )}
      </CardContent>
    </Card>
  )
}
