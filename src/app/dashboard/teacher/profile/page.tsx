import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { User } from 'lucide-react';
  
  export default function TeacherProfilePage() {
    return (
      <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Teacher Profile</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <User />
                    Profile
                </CardTitle>
                <CardDescription>
                    Manage your profile information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>This page is under construction.</p>
                <p className='mt-4 text-sm text-muted-foreground'>Features for editing your profile details are coming soon.</p>
            </CardContent>
        </Card>
      </>
    );
  }
  