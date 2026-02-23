'use client';
import Link from 'next/link';
import {
  User,
  Book,
  BarChart3,
  ClipboardCheck,
  FileText,
  CheckSquare,
  ArrowRight,
  MessageSquare,
  Ticket,
  UserCheck,
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
    href: '/dashboard/teacher/profile',
    icon: User,
  },
  {
    title: 'Student Attendance',
    description: 'Create and manage attendance sessions.',
    href: '/dashboard/teacher/attendance',
    icon: BarChart3,
  },
  {
    title: 'Mark My Attendance',
    description: 'Mark your daily attendance using face verification.',
    href: '/dashboard/teacher/mark-attendance',
    icon: UserCheck,
  },
  {
    title: 'Lesson Plans',
    description: 'Upload and manage lesson plans for your courses.',
    href: '/dashboard/teacher/academics/lesson-plan',
    icon: Book,
  },
  {
    title: 'Assignments',
    description: 'Create assignments and view student submissions.',
    href: '/dashboard/teacher/assignments',
    icon: FileText,
  },
  {
    title: 'Quizzes',
    description: 'Create and manage quizzes for your students.',
    href: '/dashboard/teacher/quizzes',
    icon: ClipboardCheck,
  },
  {
    title: 'Feedback',
    description: 'View anonymous feedback from your students.',
    href: '/dashboard/teacher/feedback',
    icon: MessageSquare,
  },
  {
    title: 'Exam Approvals',
    description: 'Approve or reject student examination forms.',
    href: '/dashboard/teacher/exam-approvals',
    icon: CheckSquare,
  },
  {
    title: 'Hall Tickets',
    description: 'Upload hall tickets for approved exam forms.',
    href: '/dashboard/teacher/hall-tickets',
    icon: Ticket,
  },
];

export default function TeacherDashboard() {
  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Teacher Dashboard</h1>
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
