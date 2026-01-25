'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

export function UserNav({ role }: { role: 'student' | 'teacher' | 'admin' }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  // The main loading state should consider auth loading, and also data loading if a user is present.
  const isLoading = isUserLoading || (user && isUserDataLoading);

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  // Prioritize Firestore data as the source of truth, but fall back to auth data.
  // This makes the UI more resilient to Firestore latency.
  const userDisplayName = userData?.displayName || user?.displayName || (role === 'admin' ? 'Admin' : 'User');
  const userEmail = userData?.email || user?.email || '';
  const userAvatarUrl = userData?.profileImageUrl || user?.photoURL;
  const fallback = userDisplayName?.charAt(0).toUpperCase() || 'U';
  const profileUrl = `/dashboard/${role}/profile`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userDisplayName} />}
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        
        {role !== 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={profileUrl} className='w-full'>Profile</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
           <Link href="/" className='w-full'>Log out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
