import { db } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';

// Patient Profile Types
export interface PatientProfile {
  id?: string;
  firebase_uid: string;
  email: string;
  personal_info: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    phone_number: string;
    emergency_contact: {
      name: string;
      relationship: string;
      phone_number: string;
    };
  };
  medical_info: {
    blood_type: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
    height_cm?: number;
    weight_kg?: number;
    allergies: string[];
    current_medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    chronic_conditions: string[];
    past_surgeries: Array<{
      name: string;
      year?: number;
    }>;
  };
  insurance_info: {
    provider_name: string;
    policy_number: string;
    group_number?: string;
    insurance_type: 'private' | 'employer' | 'government' | 'other';
    valid_until: string;
    coverage_details?: string;
  };
  identification_info: {
    type: 'national-id' | 'passport' | 'driving-license';
    number: string;
    issue_date: string;
    expiry_date?: string;
  };
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientDocument {
  id?: string;
  patient_id: string;
  firebase_uid: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  document_type: string;
  category: 'personal' | 'medical' | 'insurance' | 'identification';
  document_number: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  is_verified?: boolean;
  verification_status?: 'pending' | 'verified' | 'rejected';
}

// Save patient profile to Firestore
export async function savePatientProfile(patientData: PatientProfile): Promise<{ success: boolean; patientId?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    const patientWithTimestamps: PatientProfile = {
      ...patientData,
      created_at: patientData.created_at || now,
      updated_at: now,
      onboarding_completed: true,
      onboarding_completed_at: now
    };

    // Use firebase_uid as the document ID for easy lookup
    const patientRef = doc(db, 'patient_profiles', patientData.firebase_uid);
    
    await setDoc(patientRef, patientWithTimestamps, { merge: true });

    return { 
      success: true, 
      patientId: patientData.firebase_uid 
    };
  } catch (error: any) {
    console.error('Error saving patient profile to Firestore:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to save patient profile' 
    };
  }
}

// Save document metadata to Firestore
export async function saveDocumentMetadata(document: PatientDocument): Promise<{ success: boolean; docId?: string; error?: string }> {
  try {
    const documentsRef = collection(db, 'patient_documents');
    
    const docData: PatientDocument = {
      ...document,
      uploaded_at: document.uploaded_at || new Date().toISOString()
    };

    const docRef = await addDoc(documentsRef, docData);

    return { 
      success: true, 
      docId: docRef.id 
    };
  } catch (error: any) {
    console.error('Error saving document metadata to Firestore:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to save document metadata' 
    };
  }
}

// Get patient profile by Firebase UID
export async function getPatientProfile(firebaseUid: string): Promise<{ success: boolean; data?: PatientProfile; error?: string }> {
  try {
    const patientRef = doc(db, 'patient_profiles', firebaseUid);
    const patientSnap = await getDoc(patientRef);

    if (!patientSnap.exists()) {
      return { success: false, error: 'Patient profile not found' };
    }

    return { 
      success: true, 
      data: { id: patientSnap.id, ...patientSnap.data() } as PatientProfile 
    };
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch patient profile' 
    };
  }
}

// Get patient documents by Firebase UID
export async function getPatientDocuments(firebaseUid: string): Promise<{ success: boolean; data?: PatientDocument[]; error?: string }> {
  try {
    const documentsRef = collection(db, 'patient_documents');
    const q = query(documentsRef, where('firebase_uid', '==', firebaseUid));
    const querySnapshot = await getDocs(q);

    const documents: PatientDocument[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as PatientDocument);
    });

    return { success: true, data: documents };
  } catch (error: any) {
    console.error('Error fetching patient documents:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch documents' 
    };
  }
}

// Update patient profile
export async function updatePatientProfile(
  firebaseUid: string,
  updates: Partial<PatientProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const patientRef = doc(db, 'patient_profiles', firebaseUid);
    
    await updateDoc(patientRef, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating patient profile:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update patient profile' 
    };
  }
}

// Update onboarding status
export async function updateOnboardingStatus(
  firebaseUid: string,
  completed: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const patientRef = doc(db, 'patient_profiles', firebaseUid);
    
    await updateDoc(patientRef, {
      onboarding_completed: completed,
      onboarding_completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating onboarding status:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update onboarding status' 
    };
  }
}

// Check if patient exists
export async function checkPatientExists(firebaseUid: string): Promise<{ exists: boolean; data?: PatientProfile }> {
  try {
    const result = await getPatientProfile(firebaseUid);
    return { exists: result.success, data: result.data };
  } catch (error) {
    return { exists: false };
  }
}