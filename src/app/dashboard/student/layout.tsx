'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Menu,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { StudentNav } from '@/components/student-nav';
import { UserNav } from '@/components/user-nav';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { SearchBar } from '@/components/search';
import { useUser } from '@/firebase';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

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
            <StudentNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-4 ml-auto">
            <SearchBar />
            <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link href="/dashboard/student/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Link>
            </Button>
            <UserNav key={user?.uid} role="student" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <FirebaseErrorListener />
        {children}
      </main>
    </div>
  );
}
