export interface PatientOnboardingFormData {
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
    documents: DocumentItem[];
  };
  medicalInfo: {
    bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
    height: string;
    weight: string;
    allergies: string[];
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    chronicConditions: string[];
    pastSurgeries: Array<{
      name: string;
      year: string;
    }>;
    documents: DocumentItem[];
  };
  insuranceInfo: {
    providerName: string;
    policyNumber: string;
    groupNumber: string;
    insuranceType: 'private' | 'employer' | 'government' | 'other';
    validUntil: string;
    coverageDetails: string;
    documents: DocumentItem[];
  };
  identification: {
    type: 'national-id' | 'passport' | 'driving-license';
    number: string;
    issueDate: string;
    expiryDate: string;
    documents: DocumentItem[];
  };
  review: {
    documents: DocumentItem[];
  };
}

export interface DocumentItem {
  id: string;
  type: string;
  number: string;
  file: File | null;
  previewUrl: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  downloadUrl?: string;
}