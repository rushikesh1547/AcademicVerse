import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { ShieldCheck } from 'lucide-react';
  
  export default function AdminDashboard() {
    return (
      <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <ShieldCheck />
                    Welcome, Administrator
                </CardTitle>
                <CardDescription>
                    This is the central control panel for managing the AcademicVerse platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>From here, you can manage users (students and teachers), oversee academic content, and configure system settings.</p>
                <p className='mt-4 text-sm text-muted-foreground'>User management features are coming soon.</p>
            </CardContent>
        </Card>
      </>
    );
  }
  