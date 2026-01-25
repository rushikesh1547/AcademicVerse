'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) {
      return; // Wait for data to load
    }

    if (!user) {
      router.replace('/'); // Not logged in, go to login page
      return;
    }

    let role = 'student'; // Default role

    if (userData) {
      // If user document exists, it's the source of truth
      role = userData.role;
    } else if (user && user.email) {
      // Fallback for new users before document is created/replicated.
      // This logic MUST match the role creation logic in FirebaseProvider.
      if (user.email.endsWith('@teacher.com')) {
        role = 'teacher';
      } else if (user.email === 'user@admin.com') {
        role = 'admin';
      }
    }

    switch (role) {
      case 'teacher':
        router.replace('/dashboard/teacher');
        break;
      case 'admin':
        router.replace('/dashboard/admin');
        break;
      case 'student':
      default:
        router.replace('/dashboard/student');
        break;
    }

  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
       <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
       </div>
    </div>
  );
}
