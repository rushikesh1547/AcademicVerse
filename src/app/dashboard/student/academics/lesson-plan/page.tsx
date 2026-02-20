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
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, where, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonPlanPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const userDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null,
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const lessonPlansQuery = useMemoFirebase(() => 
    userData?.branch && userData?.currentYear 
    ? query(
        collection(firestore, 'lessonPlans'), 
        where('branch', '==', userData.branch),
        where('currentYear', '==', userData.currentYear),
        orderBy('createdAt', 'desc')
      ) 
    : null,
    [firestore, userData]
  );
  const { data: lessonPlans, isLoading: isLoadingLessonPlans } = useCollection(lessonPlansQuery);

  const isLoading = isUserLoading || isUserDataLoading || (!!user && isLoadingLessonPlans);

  if (!user && !isUserLoading) {
    return (
       <Card>
         <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>You must be logged in to view lesson plans.</CardDescription>
         </CardHeader>
       </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-6 w-6" />
          Lesson Plans
        </CardTitle>
        <CardDescription>
          Access lesson plans and academic materials for your branch and year.
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
                No lesson plans have been uploaded for your branch and year yet. Check back later.
            </p>
        )}
      </CardContent>
    </Card>
  )
}
