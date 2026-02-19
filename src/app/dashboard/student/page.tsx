'use client';
import Link from 'next/link';
import {
  User,
  Book,
  BarChart3,
  ClipboardCheck,
  FileText,
  BookOpen,
  Pencil,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';

const dashboardItems = [
  {
    title: 'Profile',
    description: 'View and edit your personal information.',
    href: '/dashboard/student/profile',
    icon: User,
  },
  {
    title: 'Lesson Plans',
    description: 'Access lesson plans shared by teachers.',
    href: '/dashboard/student/academics/lesson-plan',
    icon: Book,
  },
  {
    title: 'Attendance',
    description: 'Check your attendance records for all subjects.',
    href: '/dashboard/student/attendance',
    icon: BarChart3,
  },
  {
    title: 'Quizzes',
    description: 'Take quizzes and view your past attempts.',
    href: '/dashboard/student/quizzes',
    icon: ClipboardCheck,
  },
  {
    title: 'Assignments',
    description: 'Submit assignments and track your grades.',
    href: '/dashboard/student/assignments',
    icon: FileText,
  },
  {
    title: 'Resources',
    description: 'Download academic resources and materials.',
    href: '/dashboard/student/resources',
    icon: BookOpen,
  },
  {
    title: 'Examinations',
    description: 'Manage exam forms, hall tickets, and results.',
    href: '/dashboard/student/exams',
    icon: Pencil,
  },
  {
    title: 'Feedback',
    description: 'Provide feedback on subjects and teachers.',
    href: '/dashboard/student/feedback',
    icon: MessageSquare,
  },
];

export default function Dashboard() {
  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Student Dashboard</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardItems.map((item) => (
          <Link href={item.href} key={item.title} className="group">
            <Card className="flex flex-col h-full hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-gradient-to-br hover:from-card hover:to-muted">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <item.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <CardTitle>{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
              <CardFooter>
                 <p className="text-sm font-medium text-primary flex items-center gap-1">
                    Go to {item.title} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
