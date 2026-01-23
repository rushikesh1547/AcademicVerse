import Link from 'next/link';
import {
  GraduationCap,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { StudentNav } from '@/components/student-nav';
import { UserNav } from '@/components/user-nav';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { SearchBar } from '@/components/search';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl text-primary">AcademicVerse</span>
            </Link>
          </div>
          <div className="flex-1">
            <StudentNav />
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Contact support for any issues or questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
              <div className="mt-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                    <CardDescription>
                       Contact support for any issues or questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
          <SearchBar />
          <UserNav role="student" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          <FirebaseErrorListener />
          {children}
        </main>
      </div>
    </div>
  );
}
