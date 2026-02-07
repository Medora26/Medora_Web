// lib/firebase/patient-service.ts
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { DocumentItem, PatientOnboardingFormData } from '@/types/user/patients';
import { db } from '../../config';

export interface FirebaseDocument {
  id: string;
  type: string;
  number: string;
  url: string;
  uploadedAt: string;
}

export interface PatientProfileData {
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
    documents: FirebaseDocument[];
  };
  medicalInfo: {
    bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
    height: number;
    weight: number;
    allergies: string[];
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    chronicConditions: string[];
    pastSurgeries: Array<{
      name: string;
      year: number;
    }>;
    documents: FirebaseDocument[];
  };
  insuranceInfo: {
    providerName: string;
    policyNumber: string;
    groupNumber: string;
    insuranceType: 'private' | 'employer' | 'government' | 'other';
    validUntil: string;
    coverageDetails: string;
    documents: FirebaseDocument[];
  };
  identification: {
    type: 'national-id' | 'passport' | 'driving-license';
    number: string;
    issueDate: string;
    expiryDate: string;
    documents: FirebaseDocument[];
  };
  documents: FirebaseDocument[];
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: string;
  createdAt: string;
  updatedAt: string;
}

export class PatientService {
  // Check if user has completed onboarding
  static async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const patientDoc = await getDoc(doc(db, 'patients', userId));
      return patientDoc.exists() && patientDoc.data()?.hasCompletedOnboarding === true;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Convert DocumentItem to FirebaseDocument
  private static convertToFirebaseDocument(docItem: DocumentItem): FirebaseDocument {
    return {
      id: docItem.id,
      type: docItem.type,
      number: docItem.number,
      url: docItem.downloadUrl || '',
      uploadedAt: new Date().toISOString()
    };
  }

  // Save patient profile to Firestore
  static async savePatientProfile(
    userId: string,
    userEmail: string,
    formData: PatientOnboardingFormData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Saving patient profile for:', userId);

      // Convert all documents to Firebase format
      const allDocuments: FirebaseDocument[] = [
        ...formData.personalInfo.documents.filter(doc => doc.downloadUrl).map(doc => 
          this.convertToFirebaseDocument(doc)
        ),
        ...formData.medicalInfo.documents.filter(doc => doc.downloadUrl).map(doc => 
          this.convertToFirebaseDocument(doc)
        ),
        ...formData.insuranceInfo.documents.filter(doc => doc.downloadUrl).map(doc => 
          this.convertToFirebaseDocument(doc)
        ),
        ...formData.identification.documents.filter(doc => doc.downloadUrl).map(doc => 
          this.convertToFirebaseDocument(doc)
        )
      ];

      // Prepare data for Firestore
      const patientData: PatientProfileData = {
        uid: userId,
        email: userEmail,
        personalInfo: {
          firstName: formData.personalInfo.firstName,
          lastName: formData.personalInfo.lastName,
          dateOfBirth: formData.personalInfo.dateOfBirth,
          gender: formData.personalInfo.gender,
          phoneNumber: formData.personalInfo.phoneNumber,
          emergencyContact: {
            name: formData.personalInfo.emergencyContact.name,
            relationship: formData.personalInfo.emergencyContact.relationship,
            phoneNumber: formData.personalInfo.emergencyContact.phoneNumber
          },
          documents: allDocuments.filter(doc => {
            const personalTypes = ['birth-certificate', 'passport', 'voter-id', 'ration-card', 'other-personal'];
            return personalTypes.includes(doc.type);
          })
        },
        medicalInfo: {
          bloodType: formData.medicalInfo.bloodType,
          height: parseFloat(formData.medicalInfo.height) || 0,
          weight: parseFloat(formData.medicalInfo.weight) || 0,
          allergies: formData.medicalInfo.allergies,
          currentMedications: formData.medicalInfo.currentMedications,
          chronicConditions: formData.medicalInfo.chronicConditions,
          pastSurgeries: formData.medicalInfo.pastSurgeries.map(surgery => ({
            name: surgery.name,
            year: parseInt(surgery.year) || 0
          })),
          documents: allDocuments.filter(doc => {
            const medicalTypes = ['medical-history', 'previous-reports', 'vaccination-card', 'health-insurance-card', 'other-medical'];
            return medicalTypes.includes(doc.type);
          })
        },
        insuranceInfo: {
          providerName: formData.insuranceInfo.providerName,
          policyNumber: formData.insuranceInfo.policyNumber,
          groupNumber: formData.insuranceInfo.groupNumber,
          insuranceType: formData.insuranceInfo.insuranceType,
          validUntil: formData.insuranceInfo.validUntil,
          coverageDetails: formData.insuranceInfo.coverageDetails,
          documents: allDocuments.filter(doc => {
            const insuranceTypes = ['insurance-card-front', 'insurance-card-back', 'policy-document', 'claim-forms', 'other-insurance'];
            return insuranceTypes.includes(doc.type);
          })
        },
        identification: {
          type: formData.identification.type,
          number: formData.identification.number,
          issueDate: formData.identification.issueDate,
          expiryDate: formData.identification.expiryDate,
          documents: allDocuments.filter(doc => {
            const identificationTypes = ['aadhaar-card', 'pan-card', 'driving-license', 'passport-id', 'voter-id-card'];
            return identificationTypes.includes(doc.type);
          })
        },
        documents: allDocuments,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to Firestore
      await setDoc(doc(db, 'patients', userId), patientData);

      // Also update the users collection
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        hasCompletedOnboarding: true,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Patient profile saved successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error saving patient profile:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save patient profile' 
      };
    }
  }

  // Get patient profile
  static async getPatientProfile(userId: string): Promise<PatientProfileData | null> {
    try {
      const patientDoc = await getDoc(doc(db, 'patients', userId));
      
      if (patientDoc.exists()) {
        return patientDoc.data() as PatientProfileData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting patient profile:', error);
      return null;
    }
  }

  // Update patient profile
  static async updatePatientProfile(
    userId: string,
    updates: Partial<PatientProfileData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'patients', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
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

  // Delete patient profile (optional)
  static async deletePatientProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'patients', userId));
      
      // Update user collection
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        hasCompletedOnboarding: false,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting patient profile:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete patient profile' 
      };
    }
  }
}