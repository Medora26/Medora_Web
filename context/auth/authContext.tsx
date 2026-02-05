'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { AuthUser } from '@/types/auth/auth-layout/types';
import { getUserData, setupAuthListener } from '@/lib/firebase/auth';


interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshAuthUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  loading: true,
  error: null,
  refreshAuthUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to refresh auth user data from Firestore
  const refreshAuthUser = async () => {
    if (user) {
      try {
        const result = await getUserData(user.uid);
        if (result.success && result.user) {
          setAuthUser(result.user);
        } else {
          console.warn('Could not fetch user data:', result.error);
          setAuthUser(null);
        }
      } catch (err) {
        console.error('Error refreshing auth user:', err);
        setAuthUser(null);
      }
    }
  };

  useEffect(() => {
    // Use the setupAuthListener from auth.ts which includes Firestore data
    const unsubscribe = setupAuthListener(
      async (firebaseUser, firestoreUserData) => {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          // If we have Firestore data from the listener, use it
          if (firestoreUserData) {
            setAuthUser(firestoreUserData);
          } else {
            // Otherwise fetch it manually
            try {
              const result = await getUserData(firebaseUser.uid);
              if (result.success && result.user) {
                setAuthUser(result.user);
              } else {
                console.warn('Could not fetch user data on auth state change:', result.error);
                setAuthUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  displayName: firebaseUser.displayName || undefined,
                  photoURL: firebaseUser.photoURL || undefined,
                  createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
                  hasCompletedOnboarding: false,
                  emailVerified: firebaseUser.emailVerified
                });
              }
            } catch (err) {
              console.error('Error fetching user data:', err);
              // Create a minimal auth user from Firebase data
              setAuthUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                displayName: firebaseUser.displayName || undefined,
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
                hasCompletedOnboarding: false,
                emailVerified: firebaseUser.emailVerified
              });
            }
          }
        } else {
          setAuthUser(null);
        }
        
        setLoading(false);
        setError(null);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Listen for changes to the user and refresh auth user data
  useEffect(() => {
    if (user) {
      refreshAuthUser();
    } else {
      setAuthUser(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      authUser, 
      loading, 
      error, 
      refreshAuthUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};