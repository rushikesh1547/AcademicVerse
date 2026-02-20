'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Menu,
  LayoutDashboard,
  Users,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AdminNav } from '@/components/admin-nav';
import { UserNav } from '@/components/user-nav';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { SearchBar } from '@/components/search';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/admin/users', icon: Users, label: 'User Management' },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

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
    if (userData && userData.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  const isLoading = isUserLoading || isUserDataLoading;

  if (isLoading || !userData || userData.role !== 'admin') {
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
        <nav className="hidden flex-row items-center gap-1.5 text-sm font-medium md:flex">
          {navItems.map((item, index) => item.href && (
            <Link
                key={index}
                href={item.href}
                className={cn("transition-colors hover:text-foreground px-3 py-2 rounded-md", pathname.startsWith(item.href) ? "text-foreground font-semibold" : "text-muted-foreground")}
            >
                {item.label}
            </Link>
          ))}
        </nav>
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
            <AdminNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-4 ml-auto">
            <SearchBar />
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
