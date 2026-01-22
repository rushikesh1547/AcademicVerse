"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ClipboardCheck,
  FileText,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard/teacher', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/teacher/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/teacher/attendance', icon: BarChart3, label: 'Attendance' },
  { href: '/dashboard/teacher/assignments', icon: FileText, label: 'Assignments' },
  { href: '/dashboard/teacher/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
];

export function TeacherNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) =>
          <Link key={index} href={item.href}>
            <Button
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 rounded-lg px-3 py-2"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
      )}
    </nav>
  );
}
