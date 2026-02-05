'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ChevronRight, ChevronLeft, User as UserIcon, FileText, Stethoscope, Shield, IdCard, Upload, X, Eye, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth/authContext';
import { DocumentItem, PatientOnboardingFormData } from '@/types/user/patients';
import { uploadDocumentToSupabase, savePatientProfileToSupabase } from "@/lib/supabase/service/services"

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
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

// Helper function to create a DocumentItem
const createDocumentItem = (
  type: string, 
  number: string, 
  file: File | null, 
  previewUrl: string
): DocumentItem => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  type,
  number,
  file,
  previewUrl,
  uploadProgress: 0,
  uploadStatus: 'pending'
});

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const { user: userdata } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Current document being added for the current step
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
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        router.push('/sign-in');
      } else {
        // Check if user has already completed onboarding
        const hasCompleted = localStorage.getItem(`onboarding_completed_${currentUser.uid}`);
        if (hasCompleted === 'true') {
          router.push('/dashboard');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Drag events
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
      handleFileSelect(files[0]);
    }
  };

  // Get current step documents
  const getCurrentStepDocuments = (): DocumentItem[] => {
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

  // Get document category based on current step
  const getDocumentCategory = (): string => {
    switch (currentStep) {
      case 0: return 'personal';
      case 1: return 'medical';
      case 2: return 'insurance';
      case 3: return 'identification';
      case 4: return 'review';
      default: return 'personal';
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setNewDocument(prev => ({
      ...prev,
      file,
      previewUrl
    }));
    setError('');
  };

  // Add document to current step
  const addDocument = () => {
    if (!newDocument.type || !newDocument.number) {
      setError('Document type and number are required');
      return;
    }

    if (getCurrentStepDocuments().length >= MAX_DOCUMENTS_PER_STEP) {
      setError(`Maximum ${MAX_DOCUMENTS_PER_STEP} documents allowed per section`);
      return;
    }

    const doc = createDocumentItem(
      newDocument.type,
      newDocument.number,
      newDocument.file,
      newDocument.previewUrl
    );

    setFormData(prev => {
      const newFormData = { ...prev };
      switch (currentStep) {
        case 0:
          newFormData.personalInfo = {
            ...prev.personalInfo,
            documents: [...prev.personalInfo.documents, doc]
          };
          break;
        case 1:
          newFormData.medicalInfo = {
            ...prev.medicalInfo,
            documents: [...prev.medicalInfo.documents, doc]
          };
          break;
        case 2:
          newFormData.insuranceInfo = {
            ...prev.insuranceInfo,
            documents: [...prev.insuranceInfo.documents, doc]
          };
          break;
        case 3:
          newFormData.identification = {
            ...prev.identification,
            documents: [...prev.identification.documents, doc]
          };
          break;
        case 4:
          newFormData.review = {
            ...prev.review,
            documents: [...prev.review.documents, doc]
          };
          break;
      }
      return newFormData;
    });

    setNewDocument({ type: '', number: '', file: null, previewUrl: '' });
    setError('');
  };

  // Remove document from current step
  const removeDocument = (id: string) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      switch (currentStep) {
        case 0:
          newFormData.personalInfo = {
            ...prev.personalInfo,
            documents: prev.personalInfo.documents.filter(doc => doc.id !== id)
          };
          break;
        case 1:
          newFormData.medicalInfo = {
            ...prev.medicalInfo,
            documents: prev.medicalInfo.documents.filter(doc => doc.id !== id)
          };
          break;
        case 2:
          newFormData.insuranceInfo = {
            ...prev.insuranceInfo,
            documents: prev.insuranceInfo.documents.filter(doc => doc.id !== id)
          };
          break;
        case 3:
          newFormData.identification = {
            ...prev.identification,
            documents: prev.identification.documents.filter(doc => doc.id !== id)
          };
          break;
        case 4:
          newFormData.review = {
            ...prev.review,
            documents: prev.review.documents.filter(doc => doc.id !== id)
          };
          break;
      }
      return newFormData;
    });
  };

  // Update document status
  const updateDocumentStatus = (docId: string, status: DocumentItem['uploadStatus'], progress?: number) => {
    setFormData(prev => {
      const updateDocInArray = (docs: DocumentItem[]): DocumentItem[] => 
        docs.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                uploadStatus: status,
                uploadProgress: progress !== undefined ? progress : doc.uploadProgress
              }
            : doc
        );

      const newFormData = { ...prev };
      switch (currentStep) {
        case 0:
          newFormData.personalInfo.documents = updateDocInArray(prev.personalInfo.documents);
          break;
        case 1:
          newFormData.medicalInfo.documents = updateDocInArray(prev.medicalInfo.documents);
          break;
        case 2:
          newFormData.insuranceInfo.documents = updateDocInArray(prev.insuranceInfo.documents);
          break;
        case 3:
          newFormData.identification.documents = updateDocInArray(prev.identification.documents);
          break;
      }
      return newFormData;
    });
  };

  // Upload single document to Supabase
  const uploadDocumentToSupabaseStorage = async (doc: DocumentItem): Promise<DocumentItem> => {
    if (!user || !doc.file) {
      return { ...doc, uploadStatus: 'error' };
    }

    try {
      const category = getDocumentCategory();
      const result = await uploadDocumentToSupabase(
        doc.file,
        user.uid,
        doc.type,
        doc.number,
        category
      );

      if (result.success) {
        return {
          ...doc,
          downloadUrl: result.url,
          uploadStatus: 'completed',
          uploadProgress: 100
        };
      } else {
        return {
          ...doc,
          uploadStatus: 'error'
        };
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        ...doc,
        uploadStatus: 'error'
      };
    }
  };

  // Upload all documents on final submit
  const uploadAllDocuments = async (): Promise<DocumentItem[]> => {
    if (!user) return [];

    const allDocuments = [
      ...formData.personalInfo.documents,
      ...formData.medicalInfo.documents,
      ...formData.insuranceInfo.documents,
      ...formData.identification.documents
    ];

    const uploadedDocuments: DocumentItem[] = [];
    
    for (const doc of allDocuments) {
      if (doc.file && !doc.downloadUrl && doc.uploadStatus !== 'uploading') {
        try {
          const uploadedDoc = await uploadDocumentToSupabaseStorage(doc);
          uploadedDocuments.push(uploadedDoc);
        } catch (error) {
          console.error(`Failed to upload document ${doc.id}:`, error);
          uploadedDocuments.push({ ...doc, uploadStatus: 'error' });
        }
      } else {
        uploadedDocuments.push(doc);
      }
    }

    return uploadedDocuments;
  };

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

  // Add allergy
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

  // Remove allergy
  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        allergies: prev.medicalInfo.allergies.filter((_, i) => i !== index)
      }
    }));
  };

  // Add condition
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

  // Remove condition
  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        chronicConditions: prev.medicalInfo.chronicConditions.filter((_, i) => i !== index)
      }
    }));
  };

  // Add medication
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

  // Remove medication
  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        currentMedications: prev.medicalInfo.currentMedications.filter((_, i) => i !== index)
      }
    }));
  };

  // Add surgery
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

  // Remove surgery
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
  const nextStep = () => {
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

  // Submit form - upload documents and save data
  const handleSubmit = async () => {
    if (!user || !user.email) {
      setError('Please sign in first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Upload all documents first
      setUploadingDocuments(true);
      const allUploadedDocuments = await uploadAllDocuments();
      setUploadingDocuments(false);

      // Filter successfully uploaded documents
      const successfulDocuments = allUploadedDocuments.filter(doc => 
        doc.downloadUrl && doc.uploadStatus === 'completed'
      );

      // Prepare data for Supabase
      const dataToSave = {
        firebase_uid: user.uid,
        email: user.email,
        personalInfo: {
          ...formData.personalInfo,
          documents: formData.personalInfo.documents.map(doc => ({
            type: doc.type,
            number: doc.number,
            fileName: doc.file?.name || '',
            uploaded: !!doc.downloadUrl
          }))
        },
        medicalInfo: {
          ...formData.medicalInfo,
          height: parseFloat(formData.medicalInfo.height) || null,
          weight: parseFloat(formData.medicalInfo.weight) || null,
          pastSurgeries: formData.medicalInfo.pastSurgeries.map(s => ({
            name: s.name,
            year: parseInt(s.year) || null
          })),
          documents: formData.medicalInfo.documents.map(doc => ({
            type: doc.type,
            number: doc.number,
            fileName: doc.file?.name || '',
            uploaded: !!doc.downloadUrl
          }))
        },
        insuranceInfo: {
          ...formData.insuranceInfo,
          documents: formData.insuranceInfo.documents.map(doc => ({
            type: doc.type,
            number: doc.number,
            fileName: doc.file?.name || '',
            uploaded: !!doc.downloadUrl
          }))
        },
        identification: {
          ...formData.identification,
          documents: formData.identification.documents.map(doc => ({
            type: doc.type,
            number: doc.number,
            fileName: doc.file?.name || '',
            uploaded: !!doc.downloadUrl
          }))
        },
        documents: successfulDocuments.map(doc => ({
          type: doc.type,
          number: doc.number,
          url: doc.downloadUrl,
          fileName: doc.file?.name || '',
          uploadedAt: new Date().toISOString()
        }))
      };

      const result = await savePatientProfileToSupabase(dataToSave);

      if (result.success) {
        // Save completion status in localStorage
        localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
        
        // Mark as completed in Firebase if you have that service
        // await updateOnboardingStatus(user.uid);
        
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setSubmitting(false);
      setUploadingDocuments(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear file input
  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setNewDocument({ type: '', number: '', file: null, previewUrl: '' });
  };

  // Get total document count
  const getTotalDocumentCount = (): number => {
    return (
      formData.personalInfo.documents.length +
      formData.medicalInfo.documents.length +
      formData.insuranceInfo.documents.length +
      formData.identification.documents.length
    );
  };

  if (loading) {
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
            {/* Document Upload Section - Separate for each step */}
            {currentStep < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {currentStep === 0 && 'Personal Documents'}
                    {currentStep === 1 && 'Medical Documents'}
                    {currentStep === 2 && 'Insurance Documents'}
                    {currentStep === 3 && 'Identification Documents'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getCurrentStepDocuments().length}/{MAX_DOCUMENTS_PER_STEP}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Total: {getTotalDocumentCount()}
                    </Badge>
                  </div>
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
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="fileUpload"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileInputChange}
                      />

                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                          dragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {newDocument.file ? newDocument.file.name : 'Click or drag to upload'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Supported formats: JPG, PNG, PDF (max 5MB)
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {newDocument.previewUrl && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <div className="relative inline-block">
                            {newDocument.file?.type.startsWith('image/') ? (
                              <>
                                <img
                                  src={newDocument.previewUrl}
                                  alt="Preview"
                                  className="max-w-xs max-h-40 object-contain rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={clearFileInput}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 p-3 border rounded relative">
                                <FileText className="h-6 w-6" />
                                <span>{newDocument.file?.name}</span>
                                <button
                                  type="button"
                                  onClick={clearFileInput}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={addDocument}
                      disabled={!newDocument.type || !newDocument.number || uploadingDocuments}
                      className="w-full"
                    >
                      {uploadingDocuments ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Add Document
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Uploaded Documents Preview Cards */}
                {getCurrentStepDocuments().length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Added Documents ({getCurrentStepDocuments().length}):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getCurrentStepDocuments().map((doc) => {
                        const docType = getCurrentDocumentTypes().find(t => t.value === doc.type);
                        return (
                          <Card key={doc.id} className="relative">
                            <CardContent className="pt-4">
                              <button
                                type="button"
                                onClick={() => removeDocument(doc.id)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                disabled={uploadingDocuments}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded ${
                                  doc.uploadStatus === 'completed' ? 'bg-green-500/10 text-green-500' :
                                  doc.uploadStatus === 'uploading' ? 'bg-blue-500/10 text-blue-500' :
                                  doc.uploadStatus === 'error' ? 'bg-red-500/10 text-red-500' :
                                  'bg-gray-500/10 text-gray-500'
                                }`}>
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {docType?.label || doc.type}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    No: {doc.number}
                                  </p>
                                  {doc.file && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      File: {doc.file.name}
                                    </p>
                                  )}
                                  
                                  {/* Upload Status */}
                                  <div className="mt-2">
                                    {doc.uploadStatus === 'uploading' && (
                                      <div className="space-y-1">
                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 transition-all"
                                            style={{ width: `${doc.uploadProgress}%` }}
                                          />
                                        </div>
                                        <p className="text-xs text-blue-500">
                                          Uploading... {Math.round(doc.uploadProgress)}%
                                        </p>
                                      </div>
                                    )}
                                    {doc.uploadStatus === 'completed' && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        <span className="text-xs text-green-500">Ready for upload</span>
                                      </div>
                                    )}
                                    {doc.uploadStatus === 'error' && (
                                      <p className="text-xs text-red-500">Upload failed</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
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
                    placeholder="+91 9876543210"
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
                      placeholder="+91 9876543210"
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
                      min="0"
                      step="0.1"
                      value={formData.medicalInfo.height}
                      onChange={(e) => handleInputChange('medicalInfo', 'height', e.target.value)}
                      placeholder="170"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.medicalInfo.weight}
                      onChange={(e) => handleInputChange('medicalInfo', 'weight', e.target.value)}
                      placeholder="70"
                    />
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Allergies (Optional)</Label>
                    <Badge variant="outline">{formData.medicalInfo.allergies.length}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tempAllergy}
                      onChange={(e) => setTempAllergy(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                      placeholder="Enter allergy (e.g., Penicillin, Peanuts)"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addAllergy} 
                      variant="outline"
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.medicalInfo.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.medicalInfo.allergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="gap-2 px-3 py-1.5">
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(index)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronic Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Chronic Conditions (Optional)</Label>
                    <Badge variant="outline">{formData.medicalInfo.chronicConditions.length}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tempCondition}
                      onChange={(e) => setTempCondition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                      placeholder="Enter condition (e.g., Diabetes, Hypertension)"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addCondition} 
                      variant="outline"
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.medicalInfo.chronicConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.medicalInfo.chronicConditions.map((condition, index) => (
                        <Badge key={index} variant="outline" className="gap-2 px-3 py-1.5">
                          {condition}
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Medications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Current Medications (Optional)</Label>
                    <Badge variant="outline">{formData.medicalInfo.currentMedications.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Medication name"
                      value={tempMedication.name}
                      onChange={(e) => setTempMedication(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Dosage (e.g., 500mg)"
                      value={tempMedication.dosage}
                      onChange={(e) => setTempMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    />
                    <Input
                      placeholder="Frequency (e.g., Twice daily)"
                      value={tempMedication.frequency}
                      onChange={(e) => setTempMedication(prev => ({ ...prev, frequency: e.target.value }))}
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={addMedication} 
                    variant="outline"
                    className="w-full"
                    disabled={!tempMedication.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                  
                  {formData.medicalInfo.currentMedications.length > 0 && (
                    <div className="space-y-2">
                      {formData.medicalInfo.currentMedications.map((medication, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {medication.dosage} • {medication.frequency}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Surgeries */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Past Surgeries (Optional)</Label>
                    <Badge variant="outline">{formData.medicalInfo.pastSurgeries.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Surgery name"
                      value={tempSurgery.name}
                      onChange={(e) => setTempSurgery(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={tempSurgery.year}
                      onChange={(e) => setTempSurgery(prev => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={addSurgery} 
                    variant="outline"
                    className="w-full"
                    disabled={!tempSurgery.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Surgery
                  </Button>
                  
                  {formData.medicalInfo.pastSurgeries.length > 0 && (
                    <div className="space-y-2">
                      {formData.medicalInfo.pastSurgeries.map((surgery, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
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
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Insurance Details */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="providerName" className="text-sm font-medium">Insurance Provider *</Label>
                  <Input
                    id="providerName"
                    value={formData.insuranceInfo.providerName}
                    onChange={(e) => handleInputChange('insuranceInfo', 'providerName', e.target.value)}
                    placeholder="e.g., Blue Cross, UnitedHealthcare"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="policyNumber" className="text-sm font-medium">Policy Number *</Label>
                    <Input
                      id="policyNumber"
                      value={formData.insuranceInfo.policyNumber}
                      onChange={(e) => handleInputChange('insuranceInfo', 'policyNumber', e.target.value)}
                      placeholder="e.g., BCBS123456789"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="groupNumber" className="text-sm font-medium">Group Number (Optional)</Label>
                    <Input
                      id="groupNumber"
                      value={formData.insuranceInfo.groupNumber}
                      onChange={(e) => handleInputChange('insuranceInfo', 'groupNumber', e.target.value)}
                      placeholder="e.g., GRP12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="insuranceType" className="text-sm font-medium">Insurance Type *</Label>
                    <Select
                      value={formData.insuranceInfo.insuranceType}
                      onValueChange={(value: any) => handleInputChange('insuranceInfo', 'insuranceType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private Insurance</SelectItem>
                        <SelectItem value="employer">Employer Provided</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="validUntil" className="text-sm font-medium">Valid Until *</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.insuranceInfo.validUntil}
                      onChange={(e) => handleInputChange('insuranceInfo', 'validUntil', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="coverageDetails" className="text-sm font-medium">Coverage Details (Optional)</Label>
                  <Textarea
                    id="coverageDetails"
                    value={formData.insuranceInfo.coverageDetails}
                    onChange={(e) => handleInputChange('insuranceInfo', 'coverageDetails', e.target.value)}
                    placeholder="Describe your coverage details, limitations, etc."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Identification */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      placeholder="e.g., A12345678"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="issueDate" className="text-sm font-medium">Issue Date *</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.identification.issueDate}
                      onChange={(e) => handleInputChange('identification', 'issueDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date (Optional)</Label>
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
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertDescription className="text-primary">
                    Review your information before submitting. Documents will be uploaded when you click "Complete Setup".
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
                      <p className="text-sm"><span className="font-medium">Phone:</span> {formData.personalInfo.phoneNumber}</p>
                      <p className="text-sm"><span className="font-medium">Emergency Contact:</span> {formData.personalInfo.emergencyContact.name}</p>
                      <p className="text-sm"><span className="font-medium">Documents:</span> {formData.personalInfo.documents.length} added</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <p className="text-sm"><span className="font-medium">Blood Type:</span> {formData.medicalInfo.bloodType}</p>
                      <p className="text-sm"><span className="font-medium">Allergies:</span> {formData.medicalInfo.allergies.length > 0 ? formData.medicalInfo.allergies.join(', ') : 'None'}</p>
                      <p className="text-sm"><span className="font-medium">Conditions:</span> {formData.medicalInfo.chronicConditions.length > 0 ? formData.medicalInfo.chronicConditions.join(', ') : 'None'}</p>
                      <p className="text-sm"><span className="font-medium">Documents:</span> {formData.medicalInfo.documents.length} added</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Insurance Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <p className="text-sm"><span className="font-medium">Provider:</span> {formData.insuranceInfo.providerName || 'Not provided'}</p>
                      <p className="text-sm"><span className="font-medium">Policy Number:</span> {formData.insuranceInfo.policyNumber || 'Not provided'}</p>
                      <p className="text-sm"><span className="font-medium">Documents:</span> {formData.insuranceInfo.documents.length} added</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <IdCard className="h-4 w-4" />
                        Identification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <p className="text-sm"><span className="font-medium">Type:</span> {formData.identification.type}</p>
                      <p className="text-sm"><span className="font-medium">Number:</span> {formData.identification.number}</p>
                      <p className="text-sm"><span className="font-medium">Documents:</span> {formData.identification.documents.length} added</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Documents Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Uploaded Documents Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-blue-500">{formData.personalInfo.documents.length}</p>
                        <p className="text-sm text-muted-foreground">Personal</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-green-500">{formData.medicalInfo.documents.length}</p>
                        <p className="text-sm text-muted-foreground">Medical</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-purple-500">{formData.insuranceInfo.documents.length}</p>
                        <p className="text-sm text-muted-foreground">Insurance</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-amber-500">{formData.identification.documents.length}</p>
                        <p className="text-sm text-muted-foreground">ID</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Total documents: <span className="font-medium">{getTotalDocumentCount()}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                    disabled={submitting}
                    className="gap-2 bg-[#023ec8] hover:bg-blue-600"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingDocuments}
                    className="gap-2"
                  >
                    {submitting || uploadingDocuments ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {uploadingDocuments ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
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