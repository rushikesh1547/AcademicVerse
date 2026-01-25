'use client';

import { useUser } from '@/firebase';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  // Using the user's UID as a key for the root div of the dashboard.
  // This forces React to re-mount the entire dashboard component tree
  // whenever the user changes, guaranteeing that no stale state from a
  // previous session can persist in the UI.
  return <div key={user?.uid}>{children}</div>;
}
