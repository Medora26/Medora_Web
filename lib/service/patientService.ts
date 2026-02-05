import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PatientOnboardingFormData } from '@/types/user/patients';

// Simple interface for onboarding
/* export interface PatientData {
  uid: string;
  email: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    phoneNumber: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  medicalInfo: {
    bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
    height: number;
    weight: number;
    allergies: string[];
    currentMedications: {
      name: string;
      dosage: string;
      frequency: string;
    }[];
    chronicConditions: string[];
    pastSurgeries: {
      name: string;
      year: number;
    }[];
  };
  insuranceInfo: {
    providerName: string;
    policyNumber: string;
    groupNumber?: string;
    insuranceType: 'private' | 'employer' | 'government' | 'other';
    validUntil: string;
    coverageDetails?: string;
  };
  identification: {
    type: 'national-id' | 'passport' | 'driving-license';
    number: string;
    issueDate: string;
    expiryDate?: string;
  };
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
}
 */
export class PatientService {
  // Save patient profile - SIMPLE VERSION
  static async savePatientProfile(
    uid: string,
    email: string,
    formData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const patientRef = doc(db, 'patients', uid);
      
      const now = new Date();
      
      // Create patient profile
      const patientProfile = {
        uid,
        email,
        personalInfo: {
          firstName: formData.personalInfo?.firstName || '',
          lastName: formData.personalInfo?.lastName || '',
          dateOfBirth: formData.personalInfo?.dateOfBirth || '',
          gender: formData.personalInfo?.gender || 'prefer-not-to-say',
          phoneNumber: formData.personalInfo?.phoneNumber || '',
          emergencyContact: {
            name: formData.personalInfo?.emergencyContact?.name || '',
            relationship: formData.personalInfo?.emergencyContact?.relationship || '',
            phoneNumber: formData.personalInfo?.emergencyContact?.phoneNumber || '',
          },
        },
        medicalInfo: {
          bloodType: formData.medicalInfo?.bloodType || 'unknown',
          height: parseFloat(formData.medicalInfo?.height) || 0,
          weight: parseFloat(formData.medicalInfo?.weight) || 0,
          allergies: formData.medicalInfo?.allergies || [],
          currentMedications: formData.medicalInfo?.currentMedications || [],
          chronicConditions: formData.medicalInfo?.chronicConditions || [],
          pastSurgeries: formData.medicalInfo?.pastSurgeries || [],
        },
        insuranceInfo: {
          providerName: formData.insuranceInfo?.providerName || '',
          policyNumber: formData.insuranceInfo?.policyNumber || '',
          groupNumber: formData.insuranceInfo?.groupNumber || '',
          insuranceType: formData.insuranceInfo?.insuranceType || 'private',
          validUntil: formData.insuranceInfo?.validUntil || '',
          coverageDetails: formData.insuranceInfo?.coverageDetails || '',
        },
        identification: {
          type: formData.identification?.type || 'national-id',
          number: formData.identification?.number || '',
          issueDate: formData.identification?.issueDate || '',
          expiryDate: formData.identification?.expiryDate || '',
        },
        preferences: {
          notifications: true,
          dataSharing: false,
          language: 'en',
        },
        createdAt: now,
        updatedAt: now,
        onboardingCompleted: true,
      };
      
      await setDoc(patientRef, patientProfile);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error saving patient profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check onboarding status
  static async checkOnboardingStatus(uid: string): Promise<boolean> {
    try {
      const patientRef = doc(db, 'patients', uid);
      const patientDoc = await getDoc(patientRef);
      
      if (!patientDoc.exists()) {
        return false;
      }
      
      const data = patientDoc.data();
      return data.onboardingCompleted === true;
    } catch (error) {
      console.error('Error checking onboarding:', error);
      return false;
    }
  }
  
  // Get patient profile
  static async getPatientProfile(uid: string): Promise<{ data: PatientOnboardingFormData | null; error?: string }> {
    try {
      const patientRef = doc(db, 'patients', uid);
      const patientDoc = await getDoc(patientRef);
      
      if (!patientDoc.exists()) {
        return { data: null, error: 'Profile not found' };
      }
      
      return { data: patientDoc.data() as PatientOnboardingFormData };
    } catch (error: any) {
      console.error('Error fetching patient profile:', error);
      return { data: null, error: error.message };
    }
  }
}