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
  GraduationCap,
  LayoutDashboard,
  Pencil,
  User,
  Camera,
  ShieldAlert,
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
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  {
    label: 'Academics',
    icon: GraduationCap,
    subItems: [
      { href: '/dashboard/attendance', icon: BarChart3, label: 'Attendance' },
      { href: '/dashboard/attendance/mark', icon: Camera, label: 'Mark Attendance' },
      { href: '/dashboard/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
      { href: '/dashboard/assignments', icon: FileText, label: 'Assignments' },
      { href: '/dashboard/resources', icon: BookOpen, label: 'Resources' },
    ],
  },
  {
    label: 'Examinations',
    icon: Pencil,
    subItems: [
      { href: '/dashboard/exams', icon: Pencil, label: 'Exam Forms' },
      { href: '/dashboard/results', icon: Award, label: 'Results' },
    ],
  },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/proctoring', icon: ShieldAlert, label: 'AI Proctoring' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) =>
        item.subItems ? (
          <Accordion key={index} type="single" collapsible defaultValue={item.subItems.some(sub => pathname.startsWith(sub.href)) ? `item-${index}` : ""}>
            <AccordionItem value={`item-${index}`} className="border-b-0">
              <AccordionTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline [&[data-state=open]>svg:last-child]:rotate-90">
                 <item.icon className="h-4 w-4" />
                 {item.label}
                 <item.icon className="h-4 w-4 ml-auto shrink-0 transition-transform duration-200" />
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
              variant={pathname === item.href ? 'secondary' : 'ghost'}
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
