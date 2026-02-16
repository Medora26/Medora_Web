// lib/firestore/share.ts
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';

export interface SharedDocumentInfo {
  id: string;
  documentName: string;
  description?: string;
  cloudinary: {
    url: string;
    thumbnailUrl?: string;
    format: string;
    bytes: number;
  };
  shareSettings: {
    accessLevel: 'view' | 'download' | 'edit' | 'restricted';
    requirePassword: boolean;
    hasPassword: boolean;
    expiresAt?: Date;
    viewCount: number;
    downloadCount: number;
  };
  uploadedAt: Date;
  userEmail?: string;
}

// Get shared document info (public)
export const getSharedDocument = async (shareId: string): Promise<SharedDocumentInfo | null> => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    // Check if expired
    if (data.shareSettings?.expiresAt) {
      const expiresAt = data.shareSettings.expiresAt.toDate();
      if (expiresAt < new Date()) {
        throw new Error('Share link has expired');
      }
    }
    
    // Increment view count
    const docRef = doc.ref;
    await updateDoc(docRef, {
      'shareSettings.viewCount': increment(1)
    });
    
    return {
      id: doc.id,
      documentName: data.documentName,
      description: data.description,
      cloudinary: data.cloudinary,
      shareSettings: {
        accessLevel: data.shareSettings.accessLevel,
        requirePassword: data.shareSettings.requirePassword,
        hasPassword: !!data.shareSettings.password,
        expiresAt: data.shareSettings.expiresAt?.toDate(),
        viewCount: data.shareSettings.viewCount + 1,
        downloadCount: data.shareSettings.downloadCount
      },
      uploadedAt: data.uploadedAt.toDate(),
      userEmail: data.userEmail
    };
  } catch (error) {
    console.error('Error getting shared document:', error);
    throw error;
  }
};

// Verify password for shared document
export const verifySharedDocumentPassword = async (
  shareId: string, 
  password: string
): Promise<boolean> => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    const data = querySnapshot.docs[0].data();
    return data.shareSettings?.password === password;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw error;
  }
};

// Track download from share link
export const trackSharedDocumentDownload = async (shareId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        'shareSettings.downloadCount': increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking download:', error);
  }
};