"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin') {
        router.push('/admin/orders');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg">
      <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
      <p className="mt-4 text-brand-secondary font-medium animate-pulse">Redirecting to Medisure Plus...</p>
    </div>
  );
}
