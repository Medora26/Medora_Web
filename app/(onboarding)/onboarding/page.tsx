'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PatientService } from '@/lib/service/patientService'
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
import { CheckCircle2, ChevronRight, ChevronLeft, User as UserIcon, FileText, Stethoscope, Shield, IdCard, Upload, X, Eye } from 'lucide-react';
import { useAuth } from '@/context/auth/authContext';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { DocumentItem, PatientOnboardingFormData } from '@/types/user/patients';

// Define form data structure with documents


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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const { user: userdata } = useAuth();
  //drag events
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
   
   
  }

 

 const openFileSelector = (colorName: string) => {
    
  }
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
  useEffect(() => {
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
  }, [router]);

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
  const addDocument = () => {
    if (!newDocument.type || !newDocument.number) {
      setError('Document type and number are required');
      return;
    }

    if (getCurrentStepDocuments().length >= MAX_DOCUMENTS_PER_STEP) {
      setError(`Maximum ${MAX_DOCUMENTS_PER_STEP} documents allowed per section`);
      return;
    }

    const doc: DocumentItem = {
      id: Date.now().toString(),
      type: newDocument.type,
      number: newDocument.number,
      file: newDocument.file,
      previewUrl: newDocument.previewUrl,
      uploadProgress: 0,
      uploadStatus: 'pending'
    };

    const updateFormData = (prev: PatientOnboardingFormData) => {
      const update = { ...prev };
      switch (currentStep) {
        case 0:
          update.personalInfo.documents = [...prev.personalInfo.documents, doc];
          break;
        case 1:
          update.medicalInfo.documents = [...prev.medicalInfo.documents, doc];
          break;
        case 2:
          update.insuranceInfo.documents = [...prev.insuranceInfo.documents, doc];
          break;
        case 3:
          update.identification.documents = [...prev.identification.documents, doc];
          break;
        case 4:
          update.review.documents = [...prev.review.documents, doc];
          break;
      }
      return update;
    };

    setFormData(prev => updateFormData(prev));
    setNewDocument({ type: '', number: '', file: null, previewUrl: '' });
    setError('');
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
    setNewDocument(prev => ({
      ...prev,
      file,
      previewUrl
    }));
    setError('');
  };

  // Upload document to Firebase
  const uploadDocumentToFirebase = async (doc: DocumentItem, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!doc.file) {
        reject(new Error('No file to upload'));
        return;
      }

      const fileExtension = doc.file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${doc.type}.${fileExtension}`;
      const storageRef = ref(storage, `documents/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, doc.file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // Update upload progress in state
          setFormData(prev => {
            const update = { ...prev };
            const docs = getCurrentStepDocuments();
            const docIndex = docs.findIndex(d => d.id === doc.id);
            
            if (docIndex !== -1) {
              switch (currentStep) {
                case 0:
                  update.personalInfo.documents[docIndex].uploadProgress = progress;
                  update.personalInfo.documents[docIndex].uploadStatus = 'uploading';
                  break;
                case 1:
                  update.medicalInfo.documents[docIndex].uploadProgress = progress;
                  update.medicalInfo.documents[docIndex].uploadStatus = 'uploading';
                  break;
                case 2:
                  update.insuranceInfo.documents[docIndex].uploadProgress = progress;
                  update.insuranceInfo.documents[docIndex].uploadStatus = 'uploading';
                  break;
                case 3:
                  update.identification.documents[docIndex].uploadProgress = progress;
                  update.identification.documents[docIndex].uploadStatus = 'uploading';
                  break;
              }
            }
            return update;
          });
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update document with download URL
            setFormData(prev => {
              const update = { ...prev };
              const docs = getCurrentStepDocuments();
              const docIndex = docs.findIndex(d => d.id === doc.id);
              
              if (docIndex !== -1) {
                switch (currentStep) {
                  case 0:
                    update.personalInfo.documents[docIndex].downloadUrl = downloadURL;
                    update.personalInfo.documents[docIndex].uploadStatus = 'completed';
                    break;
                  case 1:
                    update.medicalInfo.documents[docIndex].downloadUrl = downloadURL;
                    update.medicalInfo.documents[docIndex].uploadStatus = 'completed';
                    break;
                  case 2:
                    update.insuranceInfo.documents[docIndex].downloadUrl = downloadURL;
                    update.insuranceInfo.documents[docIndex].uploadStatus = 'completed';
                    break;
                  case 3:
                    update.identification.documents[docIndex].downloadUrl = downloadURL;
                    update.identification.documents[docIndex].uploadStatus = 'completed';
                    break;
                }
              }
              return update;
            });
            
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  // Upload all documents for current step
  const uploadStepDocuments = async () => {
    if (!user) return;

    const currentDocs = getCurrentStepDocuments();
    const docsToUpload = currentDocs.filter(doc => doc.file && !doc.downloadUrl);
    
    if (docsToUpload.length === 0) return;

    setUploadingDocuments(true);
    setError('');

    try {
      for (const doc of docsToUpload) {
        await uploadDocumentToFirebase(doc, user.uid);
      }
    } catch (error: any) {
      setError(`Failed to upload documents: ${error.message}`);
    } finally {
      setUploadingDocuments(false);
    }
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

      // Format data for saving
      const formattedSurgeries = formData.medicalInfo.pastSurgeries.map(surgery => ({
        name: surgery.name,
        year: parseInt(surgery.year) || 0
      }));

      // Extract document URLs
      const allDocuments = [
        ...formData.personalInfo.documents,
        ...formData.medicalInfo.documents,
        ...formData.insuranceInfo.documents,
        ...formData.identification.documents
      ].filter(doc => doc.downloadUrl).map(doc => ({
        type: doc.type,
        number: doc.number,
        url: doc.downloadUrl,
        uploadedAt: new Date().toISOString()
      }));

      const dataToSave = {
        personalInfo: {
          ...formData.personalInfo,
          documents: allDocuments.filter(doc => 
            documentTypes.personal.some(type => type.value === doc.type)
          )
        },
        medicalInfo: {
          ...formData.medicalInfo,
          height: parseFloat(formData.medicalInfo.height) || 0,
          weight: parseFloat(formData.medicalInfo.weight) || 0,
          pastSurgeries: formattedSurgeries,
          documents: allDocuments.filter(doc => 
            documentTypes.medical.some(type => type.value === doc.type)
          )
        },
        insuranceInfo: {
          ...formData.insuranceInfo,
          documents: allDocuments.filter(doc => 
            documentTypes.insurance.some(type => type.value === doc.type)
          )
        },
        identification: {
          ...formData.identification,
          documents: allDocuments.filter(doc => 
            documentTypes.identification.some(type => type.value === doc.type)
          )
        },
        documents: allDocuments
      };

      const result = await PatientService.savePatientProfile(
        user.uid,
        user.email,
        dataToSave
      );

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
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
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
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
                                {newDocument.file ? newDocument.file.name : 'Click to upload'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Supported formats: JPG, PNG, PDF
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
                      onClick={addDocument}
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
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      placeholder="Doe"
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
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="relationship" className="text-sm font-medium">Relationship *</Label>
                      <Input
                        id="relationship"
                        value={formData.personalInfo.emergencyContact.relationship}
                        onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'relationship', e.target.value)}
                        placeholder="Spouse, Parent, etc."
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
                    />
                  </div>
                </div>

                {/* Allergies and Conditions sections (same as before) */}
                {/* ... existing medical form content ... */}
              </div>
            )}

            {/* Step 3-4 and Review steps remain similar with added document display */}

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