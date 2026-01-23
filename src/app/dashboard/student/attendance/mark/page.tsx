"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page is deprecated. It redirects any user who lands here back to the main attendance page.
 * This prevents students from accessing the old self-marking feature.
 */
export default function MarkAttendanceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/student/attendance');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-center">
        <div className='flex flex-col gap-4 items-center'>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className='text-muted-foreground'>Redirecting...</p>
        </div>
    </div>
  );
}
