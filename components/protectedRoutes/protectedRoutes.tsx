// components/protected-route.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth/authContext';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isOnboardingComplete, loading } = useAuth();

  const publicRoutes = ['/', '/sign-in', '/sign-up', '/forgot-password'];

  // Redirect logic
  useEffect(() => {
    if (loading) return;

    // No user and trying to access protected route
    if (!user && !publicRoutes.includes(pathname)) {
      router.push('/sign-in');
      return;
    }

    // User exists
    if (user) {
      // Already logged in but on auth pages
      if (['/sign-in', '/sign-up'].includes(pathname)) {
        router.push(isOnboardingComplete ? '/dashboard' : '/onboarding');
        return;
      }

      // On onboarding page but already completed
      if (pathname === '/onboarding' && isOnboardingComplete) {
        router.push('/dashboard');
        return;
      }

      // Not on onboarding but hasn't completed it
      if (pathname !== '/onboarding' && !isOnboardingComplete) {
        router.push('/onboarding');
        return;
      }
    }
  }, [user, isOnboardingComplete, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}