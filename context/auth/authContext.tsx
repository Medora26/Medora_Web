// context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  isOnboardingComplete: boolean;
  loading: boolean;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check onboarding status from the 'users' collection
  const checkOnboardingStatus = async (userId: string) => {
    try {
      // Check the 'users' collection for hasCompletedOnboarding field
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const completed = userData.hasCompletedOnboarding || false;
        console.log('📊 AuthContext - Onboarding status:', { 
          userId, 
          completed,
          exists: userDoc.exists(),
          userData 
        });
        setIsOnboardingComplete(completed);
      } else {
        console.log('📊 AuthContext - User document not found in users collection');
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error('❌ AuthContext - Error checking onboarding:', error);
      setIsOnboardingComplete(false);
    }
  };

  const refreshOnboardingStatus = async () => {
    if (user) {
      console.log('🔄 AuthContext - Refreshing onboarding status for:', user.uid);
      await checkOnboardingStatus(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔄 AuthContext - Auth state changed:', currentUser?.uid);
      setUser(currentUser);
      
      if (currentUser) {
        await checkOnboardingStatus(currentUser.uid);
      } else {
        setIsOnboardingComplete(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isOnboardingComplete, 
      loading, 
      refreshOnboardingStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}