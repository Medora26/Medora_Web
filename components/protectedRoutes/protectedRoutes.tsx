'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { PatientService } from '@/lib/service/patientService';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireOnboarding = true,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check onboarding status if user is authenticated
        try {
          const completed = await PatientService.checkOnboardingStatus(currentUser.uid);
          setIsOnboardingComplete(completed);
        } catch (error) {
          console.error('Error checking onboarding:', error);
          setIsOnboardingComplete(false);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Public routes that don't require auth
    const publicRoutes = ['/', '/sign-in', '/sign-up', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // If route requires authentication but user is not logged in
    if (requireAuth && !user && !isPublicRoute) {
      router.push(redirectTo || '/sign-in');
      return;
    }

    // If user is logged in but tries to access auth pages (sign-in, sign-up)
    if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
      // Check onboarding status first
      if (!isOnboardingComplete) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    // If user is logged in but hasn't completed onboarding
    if (user && requireOnboarding && !isOnboardingComplete && pathname !== '/onboarding') {
      router.push('/onboarding');
      return;
    }

    // If user has completed onboarding but is on onboarding page
    if (user && isOnboardingComplete && pathname === '/onboarding') {
      router.push('/dashboard');
      return;
    }

  }, [user, loading, pathname, requireAuth, requireOnboarding, isOnboardingComplete, router, redirectTo]);

  // Show loading state
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

  // If no auth required or user is authenticated, show children
  if (!requireAuth || user) {
    return <>{children}</>;
  }

  // If auth required but no user, show nothing (will redirect in useEffect)
  return null;
}