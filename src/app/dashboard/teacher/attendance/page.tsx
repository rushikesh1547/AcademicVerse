import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { BarChart3 } from 'lucide-react';
  
  export default function TeacherAttendancePage() {
    return (
      <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Manage Attendance</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <BarChart3 />
                    Attendance Management
                </CardTitle>
                <CardDescription>
                    Monitor student attendance and manage sessions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>This page is under construction.</p>
                <p className='mt-4 text-sm text-muted-foreground'>Features for creating attendance sessions and viewing records are coming soon.</p>
            </CardContent>
        </Card>
      </>
    );
  }
  