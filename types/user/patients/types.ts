export interface PatientUserProps {
  uid: string;
  email: string;
  username: string;
  displayName?: string| null;
  photoURL?: string |null;
  createdAt: Date;
  
  // Patient ID
  patientId: string;
  
  // Personal info (filled during onboarding)
  personalInfo?: {
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    phoneNumber: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
      email?: string;
    };
  };
  
  // Insurance info (filled during onboarding)
  insuranceInfo?: {
    company: string;
    policyNumber: string;
    startDate?: string;
    endDate?: string;
    contactPhone?: string;
    insuranceEmail?: string;
  };
  
  // Medical data (filled during onboarding)
  medicalData?: {
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
    height?: string;
    weight?: string;
    
    primaryDoctor?: {
      name: string;
      phone: string;
      specialization?: string;
      clinicAddress?: string;
      email?: string;
    };
    
    medications?: {
      name: string;
      dosage: string;
      frequency: string;
      prescribedBy?: string;
    }[];
    
    // Insurance claim history
    claimHistory?: {
      claimId: string;
      date: Date;
      amount: number;
      status: 'pending' | 'approved' | 'rejected';
      description: string;
    }[];
  };
  
  // Onboarding status
  hasCompletedOnboarding: boolean;
  onboardingStep?: number;
  
  // Document storage
  documents?: {
    totalCount: number;
    totalSize: number;
    lastUpdated: Date;
  };
  
  // Email preferences
  emailPreferences: {
    onboardingComplete: boolean;
    documentUploaded: boolean;
    claimStatusUpdate: boolean;
    monthlySummary: boolean;
  };
  
  // Last login
  lastLogin?: Date;
}