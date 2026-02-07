'use client';
import {nanoid} from "nanoid"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  User as UserIcon, 
  FileText, 
  Stethoscope, 
  Shield, 
  IdCard, 
  Upload, 
  X, 
  Eye,
  Plus,
  Trash2,
  Calendar,
  Scale,
  Droplets,
  Pill,
  Heart,
  BriefcaseMedical,
  FilePlus
} from 'lucide-react';
import { useAuth } from '@/context/auth/authContext';
import { DocumentItem, PatientOnboardingFormData } from '@/types/user/patients';
import { PatientService } from '@/lib/firebase/service/patients/service';
import { uploadToCloudinary } from '@/lib/cloudinary/cloudinary-util';

// Document types for each step
const documentTypes = {
  personal: [
    { value: 'birth-certificate', label: 'Birth Certificate' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter-id', label: 'Voter ID' },
    { value: 'ration-card', label: 'Ration Card' },
    { value: 'other-personal', label: 'Other Personal Document' }
  ],
  medical: [
    { value: 'medical-history', label: 'Medical History Report' },
    { value: 'previous-reports', label: 'Previous Medical Reports' },
    { value: 'vaccination-card', label: 'Vaccination Card' },
    { value: 'health-insurance-card', label: 'Health Insurance Card' },
    { value: 'other-medical', label: 'Other Medical Document' }
  ],
  insurance: [
    { value: 'insurance-card-front', label: 'Insurance Card (Front)' },
    { value: 'insurance-card-back', label: 'Insurance Card (Back)' },
    { value: 'policy-document', label: 'Policy Document' },
    { value: 'claim-forms', label: 'Claim Forms' },
    { value: 'other-insurance', label: 'Other Insurance Document' }
  ],
  identification: [
    { value: 'aadhaar-card', label: 'Aadhaar Card' },
    { value: 'pan-card', label: 'PAN Card' },
    { value: 'driving-license', label: 'Driving License' },
    { value: 'passport-id', label: 'Passport' },
    { value: 'voter-id-card', label: 'Voter ID Card' }
  ]
};

const MAX_DOCUMENTS_PER_STEP = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
 /*  const [user, setUser] = useState<User | null>(null); */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
    
  const [dragActive, setDragActive] = useState(false);

  // Initialize form data with documents
  const [formData, setFormData] = useState<PatientOnboardingFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'prefer-not-to-say',
      phoneNumber: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phoneNumber: ''
      },
      documents: []
    },
    medicalInfo: {
      bloodType: 'unknown',
      height: '',
      weight: '',
      allergies: [],
      currentMedications: [],
      chronicConditions: [],
      pastSurgeries: [],
      documents: []
    },
    insuranceInfo: {
      providerName: '',
      policyNumber: '',
      groupNumber: '',
      insuranceType: 'private',
      validUntil: '',
      coverageDetails: '',
      documents: []
    },
    identification: {
      type: 'national-id',
      number: '',
      issueDate: '',
      expiryDate: '',
      documents: []
    },
    review: {
      documents: []
    }
  });

  // Temporary states
  const [tempAllergy, setTempAllergy] = useState('');
  const [tempCondition, setTempCondition] = useState('');
  const [tempMedication, setTempMedication] = useState({
    name: '',
    dosage: '',
    frequency: ''
  });
  const [tempSurgery, setTempSurgery] = useState({
    name: '',
    year: ''
  });

  // Current document being added
  const [newDocument, setNewDocument] = useState<{
    type: string;
    number: string;
    file: File | null;
    previewUrl: string;
  }>({
    type: '',
    number: '',
    file: null,
    previewUrl: ''
  });

  const steps = [
    { 
      title: 'Personal Info', 
      subtitle: 'Basic information about you',
      icon: <UserIcon className="h-5 w-5" />
    },
    { 
      title: 'Medical History', 
      subtitle: 'Your health background',
      icon: <Stethoscope className="h-5 w-5" />
    },
    { 
      title: 'Insurance', 
      subtitle: 'Insurance information',
      icon: <Shield className="h-5 w-5" />
    },
    { 
      title: 'Identification', 
      subtitle: 'ID verification',
      icon: <IdCard className="h-5 w-5" />
    },
    { 
      title: 'Review', 
      subtitle: 'Confirm your information',
      icon: <CheckCircle2 className="h-5 w-5" />
    }
  ];

  // Check auth state
/*   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        router.push('/sign-in');
      } else {
        PatientService.checkOnboardingStatus(currentUser.uid)
          .then(completed => {
            if (completed) {
              router.push('/dashboard');
            }
          });
      }
    });

    return () => unsubscribe();
  }, [router]); */
const { user, refreshOnboardingStatus, loading: authLoading } = useAuth();
console.log("UserState",{
     userData: user
})
  // Get current step documents
  const getCurrentStepDocuments = () => {
    switch (currentStep) {
      case 0: return formData.personalInfo.documents;
      case 1: return formData.medicalInfo.documents;
      case 2: return formData.insuranceInfo.documents;
      case 3: return formData.identification.documents;
      case 4: return formData.review.documents;
      default: return [];
    }
  };

  // Get current step document types
  const getCurrentDocumentTypes = () => {
    switch (currentStep) {
      case 0: return documentTypes.personal;
      case 1: return documentTypes.medical;
      case 2: return documentTypes.insurance;
      case 3: return documentTypes.identification;
      default: return [];
    }
  };

  // Add document to current step
// Add document to current step - FIXED VERSION
const addDocument = (e?: React.MouseEvent) => {
  // Prevent default behavior and stop propagation
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Early returns for validation
  if (!newDocument.type || !newDocument.number) {
    setError('Document type and number are required');
    return;
  }

  if (getCurrentStepDocuments().length >= MAX_DOCUMENTS_PER_STEP) {
    setError(`Maximum ${MAX_DOCUMENTS_PER_STEP} documents allowed per section`);
    return;
  }

  // Create the document with a truly unique ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const docId = `doc_${timestamp}_${random}_${currentStep}`; // Add currentStep to make it more unique
  
  const newDoc: DocumentItem = {
    id: docId,
    type: newDocument.type,
    number: newDocument.number,
    file: newDocument.file,
    previewUrl: newDocument.previewUrl,
    uploadProgress: 0,
    uploadStatus: 'pending'
  };

  // Debug log
  console.log('Adding document:', { 
    id: docId, 
    type: newDoc.type, 
    number: newDoc.number,
    step: currentStep,
    existingDocs: getCurrentStepDocuments().length 
  });

  // Update form data using functional update
  setFormData(prev => {
    // Check for duplicates inside the setState function to ensure we have latest state
    const currentDocs = getCurrentStepDocumentsFromState(prev);
    const isDuplicate = currentDocs.some(existingDoc => 
      existingDoc.type === newDoc.type && 
      existingDoc.number === newDoc.number
    );
    
    if (isDuplicate) {
      console.log('Duplicate detected inside setState!');
      return prev; // Return previous state unchanged
    }
    
    const update = { ...prev };
    
    switch (currentStep) {
      case 0:
        update.personalInfo = {
          ...prev.personalInfo,
          documents: [...prev.personalInfo.documents, newDoc]
        };
        break;
      case 1:
        update.medicalInfo = {
          ...prev.medicalInfo,
          documents: [...prev.medicalInfo.documents, newDoc]
        };
        break;
      case 2:
        update.insuranceInfo = {
          ...prev.insuranceInfo,
          documents: [...prev.insuranceInfo.documents, newDoc]
        };
        break;
      case 3:
        update.identification = {
          ...prev.identification,
          documents: [...prev.identification.documents, newDoc]
        };
        break;
      case 4:
        update.review = {
          ...prev.review,
          documents: [...prev.review.documents, newDoc]
        };
        break;
    }
    
    return update;
  });

  // Clear the form
  setNewDocument({ type: '', number: '', file: null, previewUrl: '' });
  setError('');
};

// Helper function to get documents from a specific state
const getCurrentStepDocumentsFromState = (state: PatientOnboardingFormData): DocumentItem[] => {
  switch (currentStep) {
    case 0: return state.personalInfo.documents;
    case 1: return state.medicalInfo.documents;
    case 2: return state.insuranceInfo.documents;
    case 3: return state.identification.documents;
    case 4: return state.review.documents;
    default: return [];
  }
};



  // Remove document
  const removeDocument = (id: string) => {
    const updateFormData = (prev: PatientOnboardingFormData) => {
      const update = { ...prev };
      switch (currentStep) {
        case 0:
          update.personalInfo.documents = prev.personalInfo.documents.filter(doc => doc.id !== id);
          break;
        case 1:
          update.medicalInfo.documents = prev.medicalInfo.documents.filter(doc => doc.id !== id);
          break;
        case 2:
          update.insuranceInfo.documents = prev.insuranceInfo.documents.filter(doc => doc.id !== id);
          break;
        case 3:
          update.identification.documents = prev.identification.documents.filter(doc => doc.id !== id);
          break;
        case 4:
          update.review.documents = prev.review.documents.filter(doc => doc.id !== id);
          break;
      }
      return update;
    };

    setFormData(prev => updateFormData(prev));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    setError('File size must be less than 5MB');
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    setError('Only JPG, PNG, and PDF files are allowed');
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  
  // Clear the input to prevent same file re-uploads
  e.target.value = '';
  
  setNewDocument(prev => ({
    ...prev,
    file,
    previewUrl
  }));
  setError('');
};
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    const file = files[0];
    
    // Check if we already have a file
    if (newDocument.file) {
      setError('Please clear the current file first');
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setNewDocument(prev => ({
      ...prev,
      file,
      previewUrl
    }));
    setError('');
  }
};

  // Upload document to Cloudinary
// Upload document to Cloudinary - UPDATED VERSION
const uploadDocumentToCloudinary = async (doc: DocumentItem, userId: string): Promise<string> => {
  try {
    if (!doc.file) {
      throw new Error('No file to upload');
    }

    console.log('📤 Starting Cloudinary upload for document:', {
      id: doc.id,
      type: doc.type,
      fileName: doc.file.name,
      size: doc.file.size
    });

    // Update upload status
    updateDocumentStatus(doc.id, 'uploading', 0);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(doc.file, userId);

    if (!result.success || !result.url) {
      console.error('Cloudinary upload failed:', result.error);
      throw new Error(result.error || 'Upload failed');
    }

    console.log('✅ Cloudinary upload successful, URL:', result.url);

    // Update with Cloudinary URL
    updateDocumentWithUrl(doc.id, result.url, result.publicId);

    return result.url;

  } catch (error: any) {
    console.error('❌ Error uploading to Cloudinary:', error);
    updateDocumentStatus(doc.id, 'error', 0);
    throw error;
  }
};

// Upload all documents for current step
const uploadStepDocuments = async () => {
  if (!user) {
    console.error('No user found for document upload');
    return;
  }

  const currentDocs = getCurrentStepDocuments();
  const docsToUpload = currentDocs.filter(doc => 
    doc.file && 
    !doc.downloadUrl && 
    doc.uploadStatus !== 'uploading' &&
    doc.uploadStatus !== 'completed'
  );
  
  console.log('📤 Documents to upload:', {
    total: currentDocs.length,
    toUpload: docsToUpload.length,
    userId: user.uid
  });

  if (docsToUpload.length === 0) {
    console.log('✅ No documents to upload');
    return;
  }

  setUploadingDocuments(true);
  setError('');

  try {
    for (const doc of docsToUpload) {
      console.log(`📤 Uploading document: ${doc.type} - ${doc.number}`);
      await uploadDocumentToCloudinary(doc, user.uid);
    }
    console.log('✅ All documents uploaded successfully');
  } catch (error: any) {
    console.error('❌ Failed to upload documents:', error);
    setError(`Failed to upload documents: ${error.message}`);
  } finally {
    setUploadingDocuments(false);
  }
};

  // Helper function to update document status
  const updateDocumentStatus = (docId: string, status: 'pending' | 'uploading' | 'completed' | 'error', progress: number) => {
    setFormData(prev => {
      const update = { ...prev };
      
      const updateDocs = (docs: DocumentItem[]) => {
        const index = docs.findIndex(d => d.id === docId);
        if (index !== -1) {
          docs[index] = {
            ...docs[index],
            uploadStatus: status,
            uploadProgress: progress
          };
        }
        return docs;
      };

      switch (currentStep) {
        case 0:
          update.personalInfo.documents = updateDocs(prev.personalInfo.documents);
          break;
        case 1:
          update.medicalInfo.documents = updateDocs(prev.medicalInfo.documents);
          break;
        case 2:
          update.insuranceInfo.documents = updateDocs(prev.insuranceInfo.documents);
          break;
        case 3:
          update.identification.documents = updateDocs(prev.identification.documents);
          break;
      }

      return update;
    });
  };

  // Helper function to update document with URL
  const updateDocumentWithUrl = (docId: string, url: string, publicId?: string) => {
    setFormData(prev => {
      const update = { ...prev };
      
      const updateDocs = (docs: DocumentItem[]) => {
        const index = docs.findIndex(d => d.id === docId);
        if (index !== -1) {
          docs[index] = {
            ...docs[index],
            downloadUrl: url,
            uploadStatus: 'completed',
            uploadProgress: 100
          };
        }
        return docs;
      };

      switch (currentStep) {
        case 0:
          update.personalInfo.documents = updateDocs(prev.personalInfo.documents);
          break;
        case 1:
          update.medicalInfo.documents = updateDocs(prev.medicalInfo.documents);
          break;
        case 2:
          update.insuranceInfo.documents = updateDocs(prev.insuranceInfo.documents);
          break;
        case 3:
          update.identification.documents = updateDocs(prev.identification.documents);
          break;
      }

      return update;
    });
  };

  // Upload all documents for current step
/*  const uploadStepDocuments = async () => {
  if (!user) return;

  const currentDocs = getCurrentStepDocuments();
  const docsToUpload = currentDocs.filter(doc => 
    doc.file && 
    !doc.downloadUrl && 
    doc.uploadStatus !== 'uploading' // Add this check
  );
  
  if (docsToUpload.length === 0) return;

  setUploadingDocuments(true);
  setError('');

  try {
    for (const doc of docsToUpload) {
      // Mark as uploading immediately
      updateDocumentStatus(doc.id, 'uploading', 0);
      await uploadDocumentToCloudinary(doc, user.uid);
    }
  } catch (error: any) {
    setError(`Failed to upload documents: ${error.message}`);
  } finally {
    setUploadingDocuments(false);
  }
}; */



  // Handle input changes
  const handleInputChange = (section: keyof PatientOnboardingFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section: keyof PatientOnboardingFormData, parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...(prev[section] as any)[parent],
          [field]: value
        }
      }
    }));
  };

  // Medical history helper functions
  const addAllergy = () => {
    if (tempAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalInfo: {
          ...prev.medicalInfo,
          allergies: [...prev.medicalInfo.allergies, tempAllergy.trim()]
        }
      }));
      setTempAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        allergies: prev.medicalInfo.allergies.filter((_, i) => i !== index)
      }
    }));
  };

  const addCondition = () => {
    if (tempCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalInfo: {
          ...prev.medicalInfo,
          chronicConditions: [...prev.medicalInfo.chronicConditions, tempCondition.trim()]
        }
      }));
      setTempCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        chronicConditions: prev.medicalInfo.chronicConditions.filter((_, i) => i !== index)
      }
    }));
  };

  const addMedication = () => {
    if (tempMedication.name.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalInfo: {
          ...prev.medicalInfo,
          currentMedications: [...prev.medicalInfo.currentMedications, { ...tempMedication }]
        }
      }));
      setTempMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        currentMedications: prev.medicalInfo.currentMedications.filter((_, i) => i !== index)
      }
    }));
  };

  const addSurgery = () => {
    if (tempSurgery.name.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalInfo: {
          ...prev.medicalInfo,
          pastSurgeries: [...prev.medicalInfo.pastSurgeries, { ...tempSurgery }]
        }
      }));
      setTempSurgery({ name: '', year: '' });
    }
  };

  const removeSurgery = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        pastSurgeries: prev.medicalInfo.pastSurgeries.filter((_, i) => i !== index)
      }
    }));
  };

  // Navigation
  const nextStep = async () => {
    // Upload documents before proceeding to next step
    if (currentStep < steps.length - 1 && currentStep !== 4) {
      await uploadStepDocuments();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  // Submit form
 // Submit form
const handleSubmit = async () => {
  if (!user || !user.email) {
    setError('Please sign in first');
    return;
  }

  setSubmitting(true);
  setError('');

  try {
    // Upload any remaining documents
    await uploadStepDocuments();

    // Save profile using PatientService
    const result = await PatientService.savePatientProfile(
      user.uid,
      user.email,
      formData
    );

    if (result.success) {
      // REFRESH onboarding status in context
      await refreshOnboardingStatus();
      
      // FORCE redirect - this is most reliable
      window.location.href = '/dashboard';
      
    } else {
      setError(result.error || 'Failed to save profile');
    }
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  } finally {
    setSubmitting(false);
  }
};

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold">
            Welcome to <span className="font-bold bg-gradient-to-r from-[#03c4f5] to-[#023ec8] bg-clip-text text-transparent">Medora</span>.
          </h1>
          <p className="text-muted-foreground text-lg">Let's set up your medical profile</p>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted -z-10">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-primary border-primary text-primary-foreground scale-110' 
                      : 'border-muted bg-background text-muted-foreground'
                  } ${index === currentStep ? 'ring-4 ring-primary/20' : ''}`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </button>
                <div className="mt-3 text-center">
                  <p className={`text-sm font-medium transition-colors ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{step.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-primary">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-xs text-muted-foreground">
                ({Math.round(((currentStep + 1) / steps.length) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 bg-none">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                currentStep === 0 ? 'bg-blue-500/10 text-blue-500' :
                currentStep === 1 ? 'bg-green-500/10 text-green-500' :
                currentStep === 2 ? 'bg-purple-500/10 text-purple-500' :
                currentStep === 3 ? 'bg-amber-500/10 text-amber-500' :
                'bg-emerald-500/10 text-emerald-500'
              }`}>
                {steps[currentStep].icon}
              </div>
              <div>
                <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                <CardDescription className="text-base">{steps[currentStep].subtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Document Upload Section for each step except review */}
            {currentStep < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload Documents (Optional)
                  </h3>
                  <Badge variant="outline">
                    {getCurrentStepDocuments().length}/{MAX_DOCUMENTS_PER_STEP}
                  </Badge>
                </div>

                {/* Add Document Form */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="docType" className="text-sm font-medium">
                          Document Type *
                        </Label>
                        <Select
                          value={newDocument.type}
                          onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCurrentDocumentTypes().map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="docNumber" className="text-sm font-medium">
                          Document Number *
                        </Label>
                        <Input
                          id="docNumber"
                          value={newDocument.number}
                          onChange={(e) => setNewDocument(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="Enter document number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <Label htmlFor="fileUpload" className="text-sm font-medium">
                        Document File (Optional - JPG, PNG, PDF, max 5MB)
                      </Label>
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="file"
                          id="fileUpload"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileSelect}
                        />
                        <label htmlFor="fileUpload" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {newDocument.file ? newDocument.file.name : 'Click to upload or drag & drop'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Supported formats: JPG, PNG, PDF (Max 5MB)
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                      {newDocument.previewUrl && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          {newDocument.file?.type.startsWith('image/') ? (
                            <img
                              src={newDocument.previewUrl}
                              alt="Preview"
                              className="max-w-xs max-h-40 object-contain rounded border"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-3 border rounded">
                              <FileText className="h-6 w-6" />
                              <span>{newDocument.file?.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
  type="button" // IMPORTANT: Add type="button" to prevent form submission
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Disable button temporarily to prevent double clicks
    const button = e.currentTarget;
    button.disabled = true;
    
    addDocument();
    
    // Re-enable after a short delay
    setTimeout(() => {
      button.disabled = false;
    }, 1000);
  }}
  disabled={!newDocument.type || !newDocument.number || uploadingDocuments}
  className="w-full"
>
  <Upload className="h-4 w-4 mr-2" />
  Add Document
</Button>
                  </CardContent>
                </Card>

                {/* Uploaded Documents List */}
                {getCurrentStepDocuments().length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Added Documents:</h4>
                    <div className="space-y-3">
                      {getCurrentStepDocuments().map((doc) => {
                        const docType = getCurrentDocumentTypes().find(t => t.value === doc.type);
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded ${
                                doc.uploadStatus === 'completed' ? 'bg-green-500/10 text-green-500' :
                                doc.uploadStatus === 'uploading' ? 'bg-blue-500/10 text-blue-500' :
                                doc.uploadStatus === 'error' ? 'bg-red-500/10 text-red-500' :
                                'bg-gray-500/10 text-gray-500'
                              }`}>
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {docType?.label || doc.type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Number: {doc.number}
                                </p>
                                {doc.file && (
                                  <p className="text-xs text-muted-foreground">
                                    File: {doc.file.name}
                                  </p>
                                )}
                                {doc.uploadStatus === 'uploading' && (
                                  <div className="mt-1">
                                    <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 transition-all"
                                        style={{ width: `${doc.uploadProgress}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-blue-500 mt-1">
                                      Uploading... {Math.round(doc.uploadProgress)}%
                                    </p>
                                  </div>
                                )}
                                {doc.uploadStatus === 'completed' && (
                                  <p className="text-xs text-green-500 mt-1">
                                    ✓ Uploaded successfully
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.downloadUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(doc.downloadUrl, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDocument(doc.id)}
                                disabled={uploadingDocuments}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.personalInfo.firstName}
                      onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.personalInfo.dateOfBirth}
                      onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select
                      value={formData.personalInfo.gender}
                      onValueChange={(value: any) => handleInputChange('personalInfo', 'gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.personalInfo.phoneNumber}
                    onChange={(e) => handleInputChange('personalInfo', 'phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Emergency Contact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="emergencyName" className="text-sm font-medium">Contact Name *</Label>
                      <Input
                        id="emergencyName"
                        value={formData.personalInfo.emergencyContact.name}
                        onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'name', e.target.value)}
                        placeholder="Jane Smith"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="relationship" className="text-sm font-medium">Relationship *</Label>
                      <Input
                        id="relationship"
                        value={formData.personalInfo.emergencyContact.relationship}
                        onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'relationship', e.target.value)}
                        placeholder="Spouse, Parent, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="emergencyPhone" className="text-sm font-medium">Emergency Phone Number *</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.personalInfo.emergencyContact.phoneNumber}
                      onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'phoneNumber', e.target.value)}
                      placeholder="+1 (555) 987-6543"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Medical History */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="bloodType" className="text-sm font-medium">Blood Type</Label>
                    <Select
                      value={formData.medicalInfo.bloodType}
                      onValueChange={(value: any) => handleInputChange('medicalInfo', 'bloodType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.medicalInfo.height}
                      onChange={(e) => handleInputChange('medicalInfo', 'height', e.target.value)}
                      placeholder="170"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.medicalInfo.weight}
                      onChange={(e) => handleInputChange('medicalInfo', 'weight', e.target.value)}
                      placeholder="70"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Allergies
                    </Label>
                    <Badge variant="outline">
                      {formData.medicalInfo.allergies.length}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={tempAllergy}
                      onChange={(e) => setTempAllergy(e.target.value)}
                      placeholder="Enter allergy (e.g., Penicillin, Peanuts)"
                      onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                    />
                    <Button onClick={addAllergy} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.medicalInfo.allergies.length > 0 && (
                    <div className="space-y-2">
                      {formData.medicalInfo.allergies.map((allergy, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{allergy}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAllergy(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronic Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <BriefcaseMedical className="h-4 w-4" />
                      Chronic Conditions
                    </Label>
                    <Badge variant="outline">
                      {formData.medicalInfo.chronicConditions.length}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={tempCondition}
                      onChange={(e) => setTempCondition(e.target.value)}
                      placeholder="Enter condition (e.g., Diabetes, Hypertension)"
                      onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                    />
                    <Button onClick={addCondition} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.medicalInfo.chronicConditions.length > 0 && (
                    <div className="space-y-2">
                      {formData.medicalInfo.chronicConditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{condition}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Medications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Current Medications
                    </Label>
                    <Badge variant="outline">
                      {formData.medicalInfo.currentMedications.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      value={tempMedication.name}
                      onChange={(e) => setTempMedication(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Medication name"
                    />
                    <Input
                      value={tempMedication.dosage}
                      onChange={(e) => setTempMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="Dosage (e.g., 10mg)"
                    />
                    <Input
                      value={tempMedication.frequency}
                      onChange={(e) => setTempMedication(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder="Frequency (e.g., Twice daily)"
                    />
                  </div>
                  
                  <Button onClick={addMedication} type="button" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>

                  {formData.medicalInfo.currentMedications.length > 0 && (
                    <div className="space-y-3">
                      {formData.medicalInfo.currentMedications.map((med, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {med.dosage} • {med.frequency}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Surgeries */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Past Surgeries
                    </Label>
                    <Badge variant="outline">
                      {formData.medicalInfo.pastSurgeries.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={tempSurgery.name}
                      onChange={(e) => setTempSurgery(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Surgery name"
                    />
                    <Input
                      value={tempSurgery.year}
                      onChange={(e) => setTempSurgery(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="Year (e.g., 2020)"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  
                  <Button onClick={addSurgery} type="button" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Surgery
                  </Button>

                  {formData.medicalInfo.pastSurgeries.length > 0 && (
                    <div className="space-y-3">
                      {formData.medicalInfo.pastSurgeries.map((surgery, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{surgery.name}</p>
                            <p className="text-sm text-muted-foreground">Year: {surgery.year}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSurgery(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Insurance Information */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="providerName" className="text-sm font-medium">Insurance Provider *</Label>
                    <Input
                      id="providerName"
                      value={formData.insuranceInfo.providerName}
                      onChange={(e) => handleInputChange('insuranceInfo', 'providerName', e.target.value)}
                      placeholder="ABC Insurance Company"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="insuranceType" className="text-sm font-medium">Insurance Type</Label>
                    <Select
                      value={formData.insuranceInfo.insuranceType}
                      onValueChange={(value: any) => handleInputChange('insuranceInfo', 'insuranceType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="employer">Employer Provided</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="policyNumber" className="text-sm font-medium">Policy Number *</Label>
                    <Input
                      id="policyNumber"
                      value={formData.insuranceInfo.policyNumber}
                      onChange={(e) => handleInputChange('insuranceInfo', 'policyNumber', e.target.value)}
                      placeholder="POL123456789"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="groupNumber" className="text-sm font-medium">Group Number</Label>
                    <Input
                      id="groupNumber"
                      value={formData.insuranceInfo.groupNumber}
                      onChange={(e) => handleInputChange('insuranceInfo', 'groupNumber', e.target.value)}
                      placeholder="GRP987654"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="validUntil" className="text-sm font-medium">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.insuranceInfo.validUntil}
                    onChange={(e) => handleInputChange('insuranceInfo', 'validUntil', e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="coverageDetails" className="text-sm font-medium">Coverage Details</Label>
                  <textarea
                    id="coverageDetails"
                    value={formData.insuranceInfo.coverageDetails}
                    onChange={(e) => handleInputChange('insuranceInfo', 'coverageDetails', e.target.value)}
                    placeholder="Enter any additional coverage information..."
                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Identification */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="idType" className="text-sm font-medium">Identification Type *</Label>
                  <Select
                    value={formData.identification.type}
                    onValueChange={(value: any) => handleInputChange('identification', 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national-id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving-license">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="idNumber" className="text-sm font-medium">Identification Number *</Label>
                  <Input
                    id="idNumber"
                    value={formData.identification.number}
                    onChange={(e) => handleInputChange('identification', 'number', e.target.value)}
                    placeholder="Enter ID number"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="issueDate" className="text-sm font-medium">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.identification.issueDate}
                      onChange={(e) => handleInputChange('identification', 'issueDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.identification.expiryDate}
                      onChange={(e) => handleInputChange('identification', 'expiryDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {formData.personalInfo.firstName} {formData.personalInfo.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formData.personalInfo.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{formData.personalInfo.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{formData.personalInfo.phoneNumber}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">
                      {formData.personalInfo.emergencyContact.name} ({formData.personalInfo.emergencyContact.relationship})
                    </p>
                    <p className="text-sm">{formData.personalInfo.emergencyContact.phoneNumber}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Medical History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Blood Type</p>
                      <p className="font-medium">{formData.medicalInfo.bloodType === 'unknown' ? 'Not specified' : formData.medicalInfo.bloodType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="font-medium">{formData.medicalInfo.height || 'Not specified'} cm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{formData.medicalInfo.weight || 'Not specified'} kg</p>
                    </div>
                  </div>
                  
                  {formData.medicalInfo.allergies.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Allergies</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.medicalInfo.allergies.map((allergy, index) => (
                          <Badge key={index} variant="secondary">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.medicalInfo.chronicConditions.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.medicalInfo.chronicConditions.map((condition, index) => (
                          <Badge key={index} variant="secondary">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.medicalInfo.currentMedications.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Current Medications</p>
                      <div className="space-y-2 mt-1">
                        {formData.medicalInfo.currentMedications.map((med, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{med.name}</span> - {med.dosage} ({med.frequency})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.medicalInfo.pastSurgeries.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Past Surgeries</p>
                      <div className="space-y-1 mt-1">
                        {formData.medicalInfo.pastSurgeries.map((surgery, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{surgery.name}</span> ({surgery.year})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Provider</p>
                      <p className="font-medium">{formData.insuranceInfo.providerName || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Policy Number</p>
                      <p className="font-medium">{formData.insuranceInfo.policyNumber || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Insurance Type</p>
                      <p className="font-medium capitalize">{formData.insuranceInfo.insuranceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid Until</p>
                      <p className="font-medium">{formData.insuranceInfo.validUntil || 'Not specified'}</p>
                    </div>
                  </div>
                  {formData.insuranceInfo.coverageDetails && (
                    <div>
                      <p className="text-sm text-muted-foreground">Coverage Details</p>
                      <p className="font-medium">{formData.insuranceInfo.coverageDetails}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ID Type</p>
                      <p className="font-medium capitalize">{formData.identification.type.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ID Number</p>
                      <p className="font-medium">{formData.identification.number || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{formData.identification.issueDate || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">{formData.identification.expiryDate || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Uploaded Documents Summary */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Uploaded Documents
                  </h3>
                  
                  {(() => {
                    const allDocuments = [
                      ...formData.personalInfo.documents,
                      ...formData.medicalInfo.documents,
                      ...formData.insuranceInfo.documents,
                      ...formData.identification.documents
                    ];

                    if (allDocuments.length === 0) {
                      return (
                        <p className="text-muted-foreground text-center py-4">
                          No documents uploaded
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {allDocuments.map((doc) => {
                          const docType = Object.values(documentTypes)
                            .flat()
                            .find(t => t.value === doc.type);
                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${
                                  doc.uploadStatus === 'completed' ? 'bg-green-500/10 text-green-500' :
                                  'bg-gray-500/10 text-gray-500'
                                }`}>
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {docType?.label || doc.type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Number: {doc.number}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={doc.uploadStatus === 'completed' ? 'default' : 'outline'}>
                                {doc.uploadStatus === 'completed' ? 'Uploaded' : 'Pending'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-8">
              <div>
                {currentStep > 0 && (
                  <Button
                    onClick={prevStep}
                    disabled={submitting || uploadingDocuments}
                    variant="outline"
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-4">
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    disabled={submitting || uploadingDocuments}
                    className="gap-2 bg-[#023ec8] hover:bg-blue-600"
                  >
                    {uploadingDocuments ? 'Uploading...' : 'Continue'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingDocuments}
                    className="gap-2"
                  >
                    {submitting ? 'Saving...' : 'Complete Setup'}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}