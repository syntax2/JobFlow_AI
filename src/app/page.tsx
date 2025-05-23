"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/FirebaseProvider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useFirebase();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
    // If !loading and !user, FirebaseProvider handles anonymous sign-in or shows error.
    // If user becomes available, this effect will re-run and redirect.
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
        <p className="text-xl">Loading CareerCompass AI...</p>
      </div>
    );
  }

  // This part should ideally not be reached if redirection works correctly.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <p className="text-xl">Redirecting to your dashboard...</p>
    </div>
  );
}
