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
  arrayRemove
} from 'firebase/firestore';

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
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      // Check if share link has expired
      if (data.shareSettings?.expiresAt) {
        const expiresAt = data.shareSettings.expiresAt.toDate();
        if (expiresAt < new Date()) {
          return { error: 'Share link has expired', code: 'EXPIRED' };
        }
      }
      
      return { 
        id: doc.id, 
        ...data,
        // Don't expose sensitive share settings
        shareSettings: {
          ...data.shareSettings,
          password: data.shareSettings?.password ? true : false // Just indicate if password exists
        }
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document by share ID:', error);
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
      where('userId', '==', userId),
      where('isStarred', '==', true),
      where('isTrashed', '==', false),
      orderBy('starredAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting starred documents:', error);
    throw error;
  }
};

// SHARING FUNCTIONS

// Create share link for document
export const createShareLink = async (
  documentId: string,
  options: {
    accessLevel: ShareSettings['accessLevel'];
    expiresAt?: Date | null;
    requirePassword?: boolean;
    password?: string;
    sharedWith?: { email: string; accessLevel: 'view' | 'download' | 'edit' }[];
  }
) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const shareId = generateShareId();
    const shareableLink = generateShareableLink(shareId);
    
    const shareSettings: ShareSettings = {
      isPublic: options.accessLevel !== 'restricted',
      shareableLink,
      shareId,
      accessLevel: options.accessLevel,
      expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : null,
      password: options.password || null,
      requirePassword: options.requirePassword || false,
      sharedWith: options.sharedWith?.map(user => ({
        ...user,
        sharedAt: Timestamp.now()
      })) || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      viewCount: 0,
      downloadCount: 0
    };
    
    await updateDoc(docRef, {
      shareSettings,
      updatedAt: serverTimestamp()
    });
    
    return shareableLink;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
};

// Update share settings
export const updateShareSettings = async (
  documentId: string,
  updates: Partial<ShareSettings>
) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const shareSettingsRef = `shareSettings.${Object.keys(updates)[0]}`;
    
    await updateDoc(docRef, {
      [`shareSettings.${Object.keys(updates)[0]}`]: Object.values(updates)[0],
      'shareSettings.updatedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('shareSettings.shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return data.shareSettings?.password === password;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying password:', error);
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
    await deleteDoc(docRef);
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