import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react';
  
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
            <CardContent className="space-y-4">
                <p>From here, you can manage users (students and teachers), oversee academic content, and configure system settings.</p>
                
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-xl">User Management</CardTitle>
                        <CardDescription>View and manage all users in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/admin/users">
                                <Users className="mr-2 h-4 w-4" />
                                Go to User Management
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
      </>
    );
  }
  