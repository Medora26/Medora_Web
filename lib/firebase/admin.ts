import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Singleton instances
let adminApp: App | null = null;
let adminAuth: any = null;

function initializeFirebaseAdmin(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    console.log('Using existing Firebase Admin app');
    return adminApp;
  }

  console.log('Initializing Firebase Admin...');
  
  // Get credentials from environment
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.error('Missing Firebase Admin environment variables');
    throw new Error('Firebase Admin credentials not configured');
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });

    console.log('Firebase Admin initialized successfully');
    return adminApp;
  } catch (error: any) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Export a function to get auth instance
export async function getAdminAuth() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  if (!adminAuth) {
    adminAuth = getAuth(adminApp!);
  }
  return adminAuth;
}

// Helper to verify Firebase token
export async function verifyFirebaseToken(token: string) {
  try {
    const auth = await getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Export for direct use if needed
export { adminApp };