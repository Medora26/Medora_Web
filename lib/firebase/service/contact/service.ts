// services/collaboratorService.ts
import { db } from '@/lib/firebase/config';
import { ContactFormDataProps } from '@/types/contact/types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';



export async function saveCollaborator(data: ContactFormDataProps) {
  try {
    const docRef = await addDoc(collection(db, 'collaborator'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving collaborator:', error);
    return { success: false, error: 'Failed to save application' };
  }
}