"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Pencil,
  User,
  ShieldAlert,
  Ticket,
  Book,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard/student', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/student/profile', icon: User, label: 'Profile' },
  {
    label: 'Academics',
    icon: BookOpen,
    subItems: [
        { href: '/dashboard/student/academics/lesson-plan', icon: Book, label: 'Lesson Plan' },
        { href: '/dashboard/student/attendance', icon: BarChart3, label: 'Attendance' },
    ]
  },
  { href: '/dashboard/student/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
  { href: '/dashboard/student/assignments', icon: FileText, label: 'Assignments' },
  { href: '/dashboard/student/resources', icon: BookOpen, label: 'Resources' },
  {
    label: 'Examinations',
    icon: Pencil,
    subItems: [
      { href: '/dashboard/student/exams', icon: Pencil, label: 'Exam Forms' },
      { href: '/dashboard/student/hall-ticket', icon: Ticket, label: 'Hall Ticket' },
      { href: '/dashboard/student/results', icon: Award, label: 'Results' },
    ],
  },
  { href: '/dashboard/student/feedback', icon: MessageSquare, label: 'Feedback' },
  { href: '/dashboard/student/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/proctoring', icon: ShieldAlert, label: 'AI Proctoring' },
];

export function StudentNav() {
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
        ) : (
          <Link key={index} href={item.href}>
            <Button
              variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 rounded-lg px-3 py-2"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        )
      )}
    </nav>
  );
}
