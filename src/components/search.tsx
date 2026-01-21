'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// This list should be kept in sync with the navigation items in `src/components/dashboard-nav.tsx`
const searchablePages = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/profile', label: 'Profile' },
    { href: '/dashboard/attendance', label: 'Attendance' },
    { href: '/dashboard/attendance/mark', label: 'Mark Attendance' },
    { href: '/dashboard/quizzes', label: 'Quizzes' },
    { href: '/dashboard/assignments', label: 'Assignments' },
    { href: '/dashboard/resources', label: 'Resources' },
    { href: '/dashboard/exams', label: 'Exam Forms' },
    { href: '/dashboard/results', label: 'Results' },
    { href: '/dashboard/notifications', label: 'Notifications' },
    { href: '/dashboard/proctoring', label: 'AI Proctoring' },
];

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ href: string; label: string }[]>([]);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const resetSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = searchablePages.filter((page) =>
        page.label.toLowerCase().includes(query.toLowerCase().trim())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        resetSearch();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef, resetSearch]);

  const handleSuggestionClick = (href: string) => {
    router.push(href);
    resetSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[0].href);
    }
  }

  return (
    <div className="relative w-full flex-1" ref={searchContainerRef}>
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search for a page..."
            className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            />
        </div>
      {suggestions.length > 0 && (
        <Card className="absolute top-12 z-50 w-full overflow-hidden rounded-lg border bg-background shadow-md md:w-2/3 lg:w-1/3">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion.href)}
                    className="w-full justify-start font-normal"
                  >
                    {suggestion.label}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
