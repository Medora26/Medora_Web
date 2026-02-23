// lib/firebase/admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebaseAdmin() {
  if (getApps().length) {
    return getFirestore();
  }

  // Check if required environment variables exist
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️ Missing ${envVar} environment variable. Firebase Admin will not be initialized.`);
      return null;
    }
  }

  try {
    console.log('🔥 Initializing Firebase Admin...');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
    return getFirestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    return null;
  }
}

export const adminDb = initFirebaseAdmin();