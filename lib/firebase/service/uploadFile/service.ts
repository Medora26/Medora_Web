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
  serverTimestamp 
} from 'firebase/firestore';

export interface DocumentMetadata {
  userId: string;
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
  uploadedAt: string;
  updatedAt: string;
  isStarred?: boolean;
  isTrashed?: boolean;
  trashedAt?: string;
}

// Save document metadata to Firestore
export const saveDocumentMetadata = async (
  documentData: Omit<DocumentMetadata, 'uploadedAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const documentsCollection = collection(db, 'documents');
    
    const docData = {
      ...documentData,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isStarred: false,
      isTrashed: false,
    };

    const docRef = await addDoc(documentsCollection, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving document metadata:', error);
    throw error;
  }
};

// Get all documents for a user
export const getUserDocuments = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection, 
      where('userId', '==', userId),
      where('isTrashed', '==', false),
      orderBy('uploadedAt', 'desc')
    );
    
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

// Toggle starred status
export const toggleDocumentStarred = async (documentId: string, isStarred: boolean) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isStarred,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling starred:', error);
    throw error;
  }
};

// Search documents by tags, name, or category
export const searchDocuments = async (userId: string, searchTerm: string) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // You might want to use Algolia or Meilisearch for better search
    // This is a simple implementation that searches by documentName and tags
    
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
    
    // Client-side filtering
    const searchLower = searchTerm.toLowerCase();
    return documents.filter((doc: any) => 
      doc.documentName.toLowerCase().includes(searchLower) ||
      doc.categoryLabel.toLowerCase().includes(searchLower) ||
      doc.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
      doc.description?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};