'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Menu,
  Bell,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TeacherNav } from '@/components/teacher-nav';
import { UserNav } from '@/components/user-nav';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { SearchBar } from '@/components/search';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) {
      return;
    }
    if (!user) {
      router.replace('/');
      return;
    }
    if (userData && userData.role !== 'teacher') {
      router.replace('/dashboard');
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  const isLoading = isUserLoading || isUserDataLoading;

  if (isLoading || !userData || userData.role !== 'teacher') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold mr-4">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl text-primary">AcademicVerse</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <TeacherNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-4 ml-auto">
            <SearchBar />
            <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link href="/dashboard/teacher/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Link>
            </Button>
            <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <FirebaseErrorListener />
        {children}
      </main>
    </div>
  );
}
