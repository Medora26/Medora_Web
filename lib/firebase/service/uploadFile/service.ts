// lib/firestore/documents.ts
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import {StorageService} from "@/lib/firebase/service/storage-tracking/service"
import { toast } from 'sonner';
export interface ShareSettings {
  isPublic: boolean;
  shareableLink?: string;
  shareId?: string;
  accessLevel: 'view' | 'download' | 'edit' | 'restricted';
  expiresAt?: Timestamp | null;
  password?: string | null;
  requirePassword: boolean;
  sharedWith: SharedUser[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  downloadCount: number;
}


export interface SharedUser {
  email: string;
  accessLevel: 'view' | 'download' | 'edit';
  sharedAt: Timestamp;
}

export interface DocumentMetadata {
  userId: string;
  userEmail?: string;
  patientId?: string | null;
  documentName: string;
  documentDate: string;
  category: string;
  categoryLabel: string;
  description?: string;
  tags: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    fileTypeCategory: string;
  };
  cloudinary: {
    publicId: string;
    url: string;
    thumbnailUrl?: string;
    format: string;
    bytes: number;
    originalFilename: string;
  };
  uploadedAt: Timestamp;
  updatedAt: Timestamp;
  isStarred: boolean;
  starredAt?: Timestamp;
  isTrashed: boolean;
  trashedAt?: Timestamp;
  shareSettings?: ShareSettings;
}

// Generate unique share ID
const generateShareId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate shareable link
const generateShareableLink = (shareId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${baseUrl}/share/${shareId}`;
};

// Save document metadata to Firestore
// In your saveDocumentMetadata function (in the service file)
export const saveDocumentMetadata = async (documentData: any): Promise<string> => {
  try {
    // DEBUG: Log incoming data
    console.log('🔍 [DEBUG] saveDocumentMetadata received:', {
      hasIsStarred: 'isStarred' in documentData,
      isStarredValue: documentData.isStarred,
      isStarredType: typeof documentData.isStarred,
      documentName: documentData.documentName
    });

    const documentsCollection = collection(db, 'documents');
    
    const docData = {
      ...documentData,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Ensure isStarred is explicitly set
      isStarred: documentData.isStarred === true, // Force boolean
      isTrashed: false,
    };

    // DEBUG: Log final data being saved
    console.log('🔍 [DEBUG] Final document data for Firestore:', {
      isStarred: docData.isStarred,
      isStarredType: typeof docData.isStarred,
      fullData: docData
    });

    const docRef = await addDoc(documentsCollection, docData);
    
    // DEBUG: Log successful save
    console.log('🔍 [DEBUG] Document saved with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving document metadata:', error);
    throw error;
  }
};

// Get all documents for a user
export const getUserDocuments = async (userId: string, options?: {
  includeTrashed?: boolean;
  starredOnly?: boolean;
  category?: string;
  patientId?: string;
}) => {
  try {
    const documentsCollection = collection(db, 'documents');
    let constraints: any[] = [where('userId', '==', userId)];
    
    // Trash filter
    if (options?.includeTrashed) {
      constraints.push(where('isTrashed', '==', true));
    } else {
      constraints.push(where('isTrashed', '==', false));
    }
    
    // Starred filter
    if (options?.starredOnly) {
      constraints.push(where('isStarred', '==', true));
    }
    
    // Category filter
    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    // Patient filter
    if (options?.patientId) {
      constraints.push(where('patientId', '==', options.patientId));
    }
    
    constraints.push(orderBy('uploadedAt', 'desc'));
    
    const q = query(documentsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

// Get documents for a specific patient
export const getPatientDocuments = async (patientId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection, 
      where('patientId', '==', patientId),
      where('isTrashed', '==', false),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting patient documents:', error);
    throw error;
  }
};

// Get document by ID
export const getDocumentById = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

// Get document by share ID (public access)
export const getDocumentByShareId = async (shareId: string) => {
  console.log('🔍 [SERVICE] ===== START getDocumentByShareId =====');
  console.log('🔍 [SERVICE] Input shareId:', shareId);
  
  try {
    // Get from shares collection (publicly readable)
    console.log('🔍 [SERVICE] Getting share document from shares collection...');
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);
    
    console.log('🔍 [SERVICE] Share document exists?', shareDocSnap.exists());
    
    if (!shareDocSnap.exists()) {
      console.log('❌ [SERVICE] No share document found with ID:', shareId);
      return null;
    }
    
    const shareData = shareDocSnap.data();
    console.log('✅ [SERVICE] Share document found:', {
      fileId: shareData.fileId,
      documentName: shareData.documentName,
      accessLevel: shareData.accessLevel,
      requirePassword: shareData.requirePassword
    });
    
    // Check if share link has expired
    if (shareData.expiresAt) {
      const expiresAt = shareData.expiresAt.toDate();
      const now = new Date();
      if (expiresAt < now) {
        console.log('⏰ [SERVICE] Share link has expired');
        return { error: 'Share link has expired', code: 'EXPIRED' };
      }
    }
    
    // For restricted access or password protected, get full details from original
    if (shareData.accessLevel === 'restricted' || shareData.requirePassword) {
      try {
        const originalDocRef = doc(db, 'documents', shareData.fileId);
        const originalDocSnap = await getDoc(originalDocRef);
        
        if (originalDocSnap.exists()) {
          const originalData = originalDocSnap.data();
          console.log('✅ [SERVICE] Original document found with access level:', originalData.shareSettings?.accessLevel);
          
          // Use the access level from shares collection (which is now synced)
          return {
            id: shareData.fileId,
            documentName: shareData.documentName,
            description: shareData.description,
            userEmail: shareData.userEmail,
            uploadedAt: shareData.uploadedAt,
            cloudinary: {
              ...shareData.cloudinary,
              publicId: originalData.cloudinary?.publicId || ''
            },
            shareSettings: {
              accessLevel: shareData.accessLevel, // Use from shares collection
              requirePassword: shareData.requirePassword,
              password: shareData.requirePassword, // Boolean flag
              viewCount: originalData.shareSettings?.viewCount || 0,
              downloadCount: originalData.shareSettings?.downloadCount || 0,
              sharedWith: originalData.shareSettings?.sharedWith || [],
              expiresAt: shareData.expiresAt,
              isPublic: shareData.accessLevel !== 'restricted',
              shareId: shareId,
              shareableLink: shareData.shareableLink,
              createdAt: shareData.createdAt,
              updatedAt: shareData.updatedAt
            },
            category: shareData.category,
            categoryLabel: shareData.categoryLabel
          };
        }
      } catch (error) {
        console.log('⚠️ [SERVICE] Could not fetch original document');
      }
    }
    
    // For public access
    console.log('🔍 [SERVICE] Returning public share data with access level:', shareData.accessLevel);
    
    const sharedWithUsers = (shareData.sharedWith || []).map((email: string) => ({
      email,
      accessLevel: 'view',
      sharedAt: Timestamp.now()
    }));
    
    return {
      id: shareData.fileId,
      documentName: shareData.documentName,
      description: shareData.description,
      userEmail: shareData.userEmail,
      uploadedAt: shareData.uploadedAt,
      cloudinary: shareData.cloudinary,
      shareSettings: {
        accessLevel: shareData.accessLevel, // This should now reflect updates
        requirePassword: shareData.requirePassword,
        password: shareData.requirePassword,
        viewCount: 0,
        downloadCount: 0,
        sharedWith: sharedWithUsers,
        expiresAt: shareData.expiresAt,
        isPublic: shareData.accessLevel !== 'restricted',
        shareId: shareId,
        shareableLink: shareData.shareableLink,
        createdAt: shareData.createdAt,
        updatedAt: shareData.updatedAt
      },
      category: shareData.category,
      categoryLabel: shareData.categoryLabel
    };
    
  } catch (error) {
    console.error('❌ [SERVICE] Error in getDocumentByShareId:', error);
    throw error;
  }
};

// Update document metadata
export const updateDocumentMetadata = async (
  documentId: string,
  updateData: Partial<DocumentMetadata>
) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Star/Unstar document
export const toggleDocumentStarred = async (documentId: string, starred: boolean) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isStarred: starred,
      starredAt: starred ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling starred:', error);
    throw error;
  }
};

// Get all starred documents
export const getStarredDocuments = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');

    const q = query(
      documentsCollection,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    const docs = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((doc: any) => doc.isStarred === true && doc.isTrashed !== true);

    // Safe sort
    return docs.sort((a: any, b: any) => {
      if (!a.starredAt) return 1;
      if (!b.starredAt) return -1;
      return b.starredAt.seconds - a.starredAt.seconds;
    });

  } catch (error) {
    console.error('Error getting starred documents:', error);
    throw error;
  }
};
// SHARING FUNCTIONS

// Create share link for document
// Add this to your service file
export const createShareLink = async (
  fileId: string,
  options: {
    accessLevel: 'view' | 'download' | 'edit' | 'restricted';
    expiresAt?: Date | null;
    requirePassword?: boolean;
    password?: string;
    sharedWith?: { email: string; accessLevel: 'view' | 'download' | 'edit' }[];
  }
) => {
  try {
    const shareId = generateShareId();
    const shareableLink = `${window.location.origin}/share/${shareId}`;
    
    // Get the original document to copy needed data
    const docRef = doc(db, 'documents', fileId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    const documentData = docSnap.data();
    
    // 1. Update the original document with share settings
    const shareSettings = {
      shareId,
      shareableLink,
      accessLevel: options.accessLevel,
      expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : null,
      password: options.requirePassword ? options.password : null,
      requirePassword: options.requirePassword || false,
      sharedWith: options.sharedWith?.map(user => ({
        ...user,
        sharedAt: Timestamp.now()
      })) || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      viewCount: 0,
      downloadCount: 0,
      isPublic: options.accessLevel !== 'restricted'
    };
    
    await updateDoc(docRef, {
      shareSettings,
      updatedAt: Timestamp.now()
    });
    
    // 2. Create a public document in 'shares' collection
    const sharesCollection = collection(db, 'shares');
    await setDoc(doc(sharesCollection, shareId), {
      fileId,
      shareId,
      shareableLink,
      accessLevel: options.accessLevel,
      expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : null,
      requirePassword: options.requirePassword || false,
      hasPassword: !!options.password,
      sharedWith: options.sharedWith?.map(u => u.email) || [],
      createdAt: Timestamp.now(),
      
      // Copy basic document info for display
      documentName: documentData.documentName,
      description: documentData.description,
      userEmail: documentData.userEmail,
      uploadedAt: documentData.uploadedAt,
      cloudinary: {
        url: documentData.cloudinary.url,
        thumbnailUrl: documentData.cloudinary.thumbnailUrl,
        format: documentData.cloudinary.format,
        bytes: documentData.cloudinary.bytes
      },
      category: documentData.category,
      categoryLabel: documentData.categoryLabel
    });
    
    return shareableLink;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
};
// Update share settings
// Update share settings
export const updateShareSettings = async (
  documentId: string,
  updates: Partial<ShareSettings>
) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    const data = docSnap.data();
    const shareId = data.shareSettings?.shareId;
    
    // Update the original document
    await updateDoc(docRef, {
      ...Object.keys(updates).reduce((acc, key) => {
        acc[`shareSettings.${key}`] = updates[key as keyof ShareSettings];
        return acc;
      }, {} as any),
      'shareSettings.updatedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Also update the shares collection if shareId exists
    if (shareId) {
      const shareDocRef = doc(db, 'shares', shareId);
      const shareDocSnap = await getDoc(shareDocRef);
      
      if (shareDocSnap.exists()) {
        // Update relevant fields in shares collection
        const shareUpdates: any = {
          updatedAt: serverTimestamp()
        };
        
        // Update access level if it changed
        if (updates.accessLevel) {
          shareUpdates.accessLevel = updates.accessLevel;
        }
        
        // Update password requirement
        if (updates.requirePassword !== undefined) {
          shareUpdates.requirePassword = updates.requirePassword;
          shareUpdates.hasPassword = !!updates.password;
        }
        
        // Update expiry
        if (updates.expiresAt !== undefined) {
          shareUpdates.expiresAt = updates.expiresAt;
        }
        
        // Update sharedWith emails list
        if (updates.sharedWith) {
          shareUpdates.sharedWith = updates.sharedWith.map(u => u.email);
        }
        
        await updateDoc(shareDocRef, shareUpdates);
      }
    }
    
  } catch (error) {
    console.error('Error updating share settings:', error);
    throw error;
  }
};

// Disable sharing (make private)
export const disableSharing = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      shareSettings: {
        isPublic: false,
        accessLevel: 'restricted',
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error disabling sharing:', error);
    throw error;
  }
};

// Add user to shared list
export const addSharedUser = async (
  documentId: string,
  user: { email: string; accessLevel: 'view' | 'download' | 'edit' }
) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const newSharedUser = {
      ...user,
      sharedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, {
      'shareSettings.sharedWith': arrayUnion(newSharedUser),
      'shareSettings.updatedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding shared user:', error);
    throw error;
  }
};

// Remove user from shared list
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
        await updateDoc(docRef, {
          'shareSettings.sharedWith': arrayRemove(userToRemove),
          'shareSettings.updatedAt': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error removing shared user:', error);
    throw error;
  }
};

// Verify share password
export const verifySharePassword = async (
  shareId: string,
  password: string
): Promise<boolean> => {
  console.log('🔍 [SERVICE][PASSWORD] ===== START verifySharePassword =====');
  console.log('🔍 [SERVICE][PASSWORD] Verifying password for shareId:', shareId);
  
  try {
    // First, get the share document from public shares collection
    console.log('🔍 [SERVICE][PASSWORD] Getting share document from shares collection...');
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);
    
    if (!shareDocSnap.exists()) {
      console.log('❌ [SERVICE][PASSWORD] Share document not found');
      return false;
    }
    
    const shareData = shareDocSnap.data();
    console.log('✅ [SERVICE][PASSWORD] Share document found for file:', shareData.fileId);
    console.log('🔍 [SERVICE][PASSWORD] Document name:', shareData.documentName);
    console.log('🔍 [SERVICE][PASSWORD] Requires password:', shareData.requirePassword);
    console.log('🔍 [SERVICE][PASSWORD] Has password flag:', shareData.hasPassword);
    
    // Now get the original document to check the actual password
    if (!shareData.fileId) {
      console.log('❌ [SERVICE][PASSWORD] No fileId in share document');
      return false;
    }
    
    console.log('🔍 [SERVICE][PASSWORD] Getting original document...');
    const originalDocRef = doc(db, 'documents', shareData.fileId);
    const originalDocSnap = await getDoc(originalDocRef);
    
    if (!originalDocSnap.exists()) {
      console.log('❌ [SERVICE][PASSWORD] Original document not found');
      return false;
    }
    
    const originalData = originalDocSnap.data();
    console.log('✅ [SERVICE][PASSWORD] Original document found');
    console.log('🔍 [SERVICE][PASSWORD] Stored password exists:', !!originalData.shareSettings?.password);
    
    // Compare passwords
    const storedPassword = originalData.shareSettings?.password;
    const isValid = storedPassword === password;
    console.log('🔍 [SERVICE][PASSWORD] Password valid:', isValid);
    console.log('🔍 [SERVICE][PASSWORD] ===== END verifySharePassword =====');
    
    return isValid;
    
  } catch (error:any) {
    console.error('❌ [SERVICE][PASSWORD] Error verifying password:');
   /*  console.error('❌ [SERVICE][PASSWORD] Error code:', error.code);
    console.error('❌ [SERVICE][PASSWORD] Error message:', error.message); */
    console.error('❌ [SERVICE][PASSWORD] Full error:', error);
    console.log('🔍 [SERVICE][PASSWORD] ===== END verifySharePassword (error) =====');
    
    // If it's a permission error, it might be because the user isn't authenticated
    if (error.code === 'permission-denied') {
      console.log('🔍 [SERVICE][PASSWORD] Permission denied - user may need to be authenticated');
      // Re-throw with a clearer message
      throw new Error('Authentication required to verify password');
    }
    
    throw error;
  }
};


// Track view
export const trackShareView = async (shareId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'documents', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        'shareSettings.viewCount': increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};

// Track download
export const trackShareDownload = async (shareId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'documents', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        'shareSettings.downloadCount': increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking download:', error);
  }
};

// Soft delete (move to trash)
export const trashDocument = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isTrashed: true,
      trashedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error trashing document:', error);
    throw error;
  }
};

// Restore from trash
export const restoreDocument = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isTrashed: false,
      trashedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring document:', error);
    throw error;
  }
};

// Permanently delete document
export const permanentlyDeleteDocument = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef)
    
    if(!docSnap.exists()) {
        toast.error(`Document Not Found`)
        return;
    }
    const data = docSnap.data();
    const userId = data.userId || 'undefine'; 
    const fileBytes = data.cloudinary?.bytes || 0

const publicId = data.cloudinary?.publicId;

// 1️⃣ delete from cloudinary
if (publicId) {
  await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicId }),
  });
}

// 2️⃣ delete firestore doc
await deleteDoc(docRef);

    if(userId && fileBytes > 0) {
         await StorageService.removeFileStorage(userId, fileBytes)
         toast.success(`Storage updated: remove ${fileBytes} bytes for user ${userId}`)
    }

    
     
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get trashed documents
export const getTrashedDocuments = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', true),
      orderBy('trashedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting trashed documents:', error);
    throw error;
  }
};

// Search documents
export const searchDocuments = async (userId: string, searchTerm: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const searchLower = searchTerm.toLowerCase();
    return documents.filter((doc: any) => 
      doc.documentName.toLowerCase().includes(searchLower) ||
      doc.categoryLabel.toLowerCase().includes(searchLower) ||
      doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
      doc.description?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

// Get document statistics
export const getDocumentStatistics = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => doc.data());
    
    return {
      totalDocuments: documents.length,
      starredDocuments: documents.filter(doc => doc.isStarred).length,
      totalSize: documents.reduce((acc, doc) => acc + (doc.cloudinary?.bytes || 0), 0),
      categories: documents.reduce((acc: any, doc) => {
        acc[doc.categoryLabel] = (acc[doc.categoryLabel] || 0) + 1;
        return acc;
      }, {}),
      fileTypes: documents.reduce((acc: any, doc) => {
        const type = doc.fileInfo?.fileTypeCategory || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting document statistics:', error);
    throw error;
  }
};
// Get recent uploads for a user
export const getRecentUploads = async (
  userId: string, 
  limitCount: number = 10,
  options?: {
    includeTrashed?: boolean;
  }
) => {
  try {
    const documentsCollection = collection(db, 'documents');
    let constraints: any[] = [
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    ];
    
    // Trash filter - default to false unless specified
    if (options?.includeTrashed) {
      constraints.push(where('isTrashed', '==', true));
    } else {
      constraints.push(where('isTrashed', '==', false));
    }
    
    const q = query(documentsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    // Get all documents and limit manually since we can't combine orderBy with multiple conditions easily
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Return only the most recent ones up to limitCount
    return documents.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting recent uploads:', error);
    throw error;
  }
};

// Alternative version if you want to filter by date range as well
export const getRecentUploadsByDateRange = async (
  userId: string,
  days: number = 7,
  limitCount: number = 10
) => {
  try {
    const documentsCollection = collection(db, 'documents');
    
    // Calculate date from X days ago
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false),
      where('uploadedAt', '>=', Timestamp.fromDate(date)),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.slice(0, limitCount).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recent uploads by date range:', error);
    throw error;
  }
};