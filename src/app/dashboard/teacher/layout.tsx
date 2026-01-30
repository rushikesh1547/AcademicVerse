'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Menu,
  LayoutDashboard,
  User,
  ClipboardCheck,
  FileText,
  BarChart3,
  CheckSquare,
  Ticket,
  BookOpen,
  Book,
  ChevronDown
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
import { useUser } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard/teacher', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/teacher/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/teacher/attendance', icon: BarChart3, label: 'Attendance' },
  {
    label: 'Academics',
    icon: BookOpen,
    subItems: [
        { href: '/dashboard/teacher/academics/lesson-plan', icon: Book, label: 'Lesson Plan' },
    ]
  },
  { href: '/dashboard/teacher/assignments', icon: FileText, label: 'Assignments' },
  { href: '/dashboard/teacher/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
  { href: '/dashboard/teacher/exam-approvals', icon: CheckSquare, label: 'Exam Approvals' },
  { href: '/dashboard/teacher/hall-tickets', icon: Ticket, label: 'Hall Tickets' },
];

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();

  const isSubItemActive = (subItems: any[]) => subItems.some(sub => pathname.startsWith(sub.href));
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold mr-4">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl text-primary">AcademicVerse</span>
        </Link>
        <nav className="hidden flex-row items-center gap-1.5 text-sm font-medium md:flex">
          {navItems.map((item, index) =>
            item.subItems ? (
              <DropdownMenu key={index}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("flex items-center gap-1 text-muted-foreground", isSubItemActive(item.subItems) && "text-foreground font-semibold")}>
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {item.subItems.map((subItem) => (
                    <DropdownMenuItem key={subItem.href} asChild>
                      <Link href={subItem.href}>{subItem.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item.href ? (
                <Link
                    key={index}
                    href={item.href}
                    className={cn("transition-colors hover:text-foreground px-3 py-2 rounded-md", pathname.startsWith(item.href) ? "text-foreground font-semibold" : "text-muted-foreground")}
                >
                    {item.label}
                </Link>
            ) : null
          )}
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
            <TeacherNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-4 ml-auto">
            <SearchBar />
            <UserNav key={user?.uid} role="teacher" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <FirebaseErrorListener />
        {children}
      </main>
    </div>
  );
}
