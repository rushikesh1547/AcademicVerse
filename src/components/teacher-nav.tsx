"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ClipboardCheck,
  FileText,
  BarChart3,
  CheckSquare,
  Ticket,
  BookOpen,
  Book,
  MessageSquare,
  Bell,
  Pencil,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// Reorganized navItems to match student structure with accordions
const navItems = [
  { href: '/dashboard/teacher', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/teacher/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/teacher/attendance', icon: BarChart3, label: 'Student Attendance' },
  { href: '/dashboard/teacher/mark-attendance', icon: UserCheck, label: 'Mark My Attendance' },
  {
    label: 'Academics',
    icon: BookOpen,
    subItems: [
        { href: '/dashboard/teacher/academics/lesson-plan', icon: Book, label: 'Lesson Plan' },
    ]
  },
  {
    label: 'Assessments', // New Group
    icon: FileText,
    subItems: [
        { href: '/dashboard/teacher/assignments', icon: FileText, label: 'Assignments' },
        { href: '/dashboard/teacher/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
    ]
  },
  {
    label: 'Examinations', // New Group
    icon: Pencil,
    subItems: [
      { href: '/dashboard/teacher/exam-approvals', icon: CheckSquare, label: 'Exam Approvals' },
      { href: '/dashboard/teacher/hall-tickets', icon: Ticket, label: 'Hall Tickets' },
    ]
  },
  { href: '/dashboard/teacher/feedback', icon: MessageSquare, label: 'Feedback' },
  { href: '/dashboard/teacher/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/proctoring', icon: ShieldAlert, label: 'AI Proctoring' },
];

export function TeacherNav() {
  const pathname = usePathname();

  const isParentActive = (subItems: any[]) => {
    return subItems.some(sub => pathname.startsWith(sub.href))
  }

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) =>
        item.subItems ? (
            <Accordion key={index} type="single" collapsible defaultValue={isParentActive(item.subItems) ? `item-${index}` : ""}>
              <AccordionItem value={`item-${index}`} className="border-b-0">
                <AccordionTrigger className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline [&[data-state=open]>svg:last-child]:rotate-90", isParentActive(item.subItems) && "text-primary bg-accent")}>
                   <item.icon className="h-4 w-4" />
                   {item.label}
                </AccordionTrigger>
                <AccordionContent className="pl-8 pt-2">
                  <div className="grid items-start gap-2">
                  {item.subItems.map((subItem, subIndex) => (
                    <Link key={subIndex} href={subItem.href}>
                      <Button
                        variant={pathname.startsWith(subItem.href) ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2"
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.label}
                      </Button>
                    </Link>
                  ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : item.href ? (
            <Link key={index} href={item.href}>
                <Button
                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 rounded-lg px-3 py-2"
                >
                <item.icon className="h-4 w-4" />
                {item.label}
                </Button>
            </Link>
        ) : null
      )}
    </nav>
  );
}
