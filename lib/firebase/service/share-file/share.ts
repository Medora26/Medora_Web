// lib/firestore/share.ts
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  increment,
  getDoc,
  arrayRemove,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { SharedUser } from '../uploadFile/service';

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

// In your service file, replace the verifySharePassword function with this:

export const verifySharePassword = async (
  shareId: string,
  password: string
): Promise<boolean> => {
  console.log('🔍 [PASSWORD] ===== START verifySharePassword =====');
  console.log('🔍 [PASSWORD] Verifying password for shareId:', shareId);
  
  try {
    // First, get the share document from public shares collection
    console.log('🔍 [PASSWORD] Getting share document from shares collection...');
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);
    
    if (!shareDocSnap.exists()) {
      console.log('❌ [PASSWORD] Share document not found');
      return false;
    }
    
    const shareData = shareDocSnap.data();
    console.log('✅ [PASSWORD] Share document found for file:', shareData.fileId);
    console.log('🔍 [PASSWORD] Document name:', shareData.documentName);
    console.log('🔍 [PASSWORD] Requires password:', shareData.requirePassword);
    console.log('🔍 [PASSWORD] Has password:', shareData.hasPassword);
    
    // Now get the original document to check the actual password
    // The user must be authenticated to read the original document
    if (!shareData.fileId) {
      console.log('❌ [PASSWORD] No fileId in share document');
      return false;
    }
    
    console.log('🔍 [PASSWORD] Getting original document...');
    const originalDocRef = doc(db, 'documents', shareData.fileId);
    const originalDocSnap = await getDoc(originalDocRef);
    
    if (!originalDocSnap.exists()) {
      console.log('❌ [PASSWORD] Original document not found');
      return false;
    }
    
    const originalData = originalDocSnap.data();
    console.log('✅ [PASSWORD] Original document found');
    console.log('🔍 [PASSWORD] Stored password exists:', !!originalData.shareSettings?.password);
    
    // Compare passwords
    const isValid = originalData.shareSettings?.password === password;
    console.log('🔍 [PASSWORD] Password valid:', isValid);
    console.log('🔍 [PASSWORD] ===== END verifySharePassword =====');
    
    return isValid;
    
  } catch (error) {
    console.error('❌ [PASSWORD] Error verifying password:');
    console.error('❌ [PASSWORD] Full error:', error);
    console.log('🔍 [PASSWORD] ===== END verifySharePassword (error) =====');
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

// Update trackShareView
export const trackShareView = async (shareId: string) => {
  console.log('🔍 [TRACK] Tracking view for share:', shareId);
  
  try {
    // Get the share document first
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);
    
    if (!shareDocSnap.exists()) {
      console.log('❌ [TRACK] Share document not found');
      return;
    }
    
    const shareData = shareDocSnap.data();
    
    // Update view count in original document
    if (shareData.fileId) {
      const originalDocRef = doc(db, 'documents', shareData.fileId);
      await updateDoc(originalDocRef, {
        'shareSettings.viewCount': increment(1)
      });
      console.log('✅ [TRACK] View count incremented for document:', shareData.fileId);
    }
  } catch (error) {
    console.error('❌ [TRACK] Error tracking view:', error);
  }
};

// Update trackShareDownload
export const trackShareDownload = async (shareId: string) => {
  console.log('🔍 [TRACK] Tracking download for share:', shareId);
  
  try {
    // Get the share document first
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);
    
    if (!shareDocSnap.exists()) {
      console.log('❌ [TRACK] Share document not found');
      return;
    }
    
    const shareData = shareDocSnap.data();
    
    // Update download count in original document
    if (shareData.fileId) {
      const originalDocRef = doc(db, 'documents', shareData.fileId);
      await updateDoc(originalDocRef, {
        'shareSettings.downloadCount': increment(1)
      });
      console.log('✅ [TRACK] Download count incremented for document:', shareData.fileId);
    }
  } catch (error) {
    console.error('❌ [TRACK] Error tracking download:', error);
  }
};


// Update disableSharing to also remove from shares collection
export const disableSharing = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    const data = docSnap.data();
    const shareId = data.shareSettings?.shareId;
    
    // Remove from shares collection if exists
    if (shareId) {
      const shareDocRef = doc(db, 'shares', shareId);
      await deleteDoc(shareDocRef);
    }
    
    // Update document
    await updateDoc(docRef, {
      shareSettings: null,
      updatedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error disabling sharing:', error);
    throw error;
  }
};

// Update removeSharedUser to also update shares collection
export const removeSharedUser = async (
  documentId: string,
  userEmail: string
) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const userToRemove = data.shareSettings?.sharedWith?.find(
        (u: SharedUser) => u.email === userEmail
      );
      
      if (userToRemove) {
        // Update document
        await updateDoc(docRef, {
          'shareSettings.sharedWith': arrayRemove (userToRemove),
          'shareSettings.updatedAt': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Update shares collection if exists
        const shareId = data.shareSettings?.shareId;
        if (shareId) {
          const shareDocRef = doc(db, 'shares', shareId);
          const shareDocSnap = await getDoc(shareDocRef);
          
          if (shareDocSnap.exists()) {
            const shareData = shareDocSnap.data();
            const updatedSharedWith = (shareData.sharedWith || []).filter(
              (email: string) => email !== userEmail
            );
            
            await updateDoc(shareDocRef, {
              sharedWith: updatedSharedWith
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error removing shared user:', error);
    throw error;
  }
};