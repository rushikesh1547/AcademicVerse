import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FilePlus2 } from 'lucide-react';

export default function TeacherDashboard() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Teacher Dashboard</h1>
      </div>
       <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <FilePlus2 />
                    Welcome, Teacher
                </CardTitle>
                <CardDescription>
                    Manage your academic activities from this dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>You can create and manage quizzes, assignments, and view student progress.</p>
                <p className='mt-4 text-sm text-muted-foreground'>Use the navigation on the left to get started.</p>
            </CardContent>
        </Card>
    </>
  );
}
