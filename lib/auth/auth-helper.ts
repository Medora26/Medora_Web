import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminAuth = getAuth();

export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      valid: true,
    };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return { valid: false, error };
  }
}

export async function getFirebaseUser(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
    };
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return null;
  }
}
