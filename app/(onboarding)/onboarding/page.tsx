'use client';

import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ChevronRight, ChevronLeft, User as UserIcon, FileText, Stethoscope, Shield, IdCard } from 'lucide-react';

// Define form data structure
interface FormData {
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
  };
  insuranceInfo: {
    providerName: string;
    policyNumber: string;
    groupNumber: string;
    insuranceType: 'private' | 'employer' | 'government' | 'other';
    validUntil: string;
    coverageDetails: string;
  };
  identification: {
    type: 'national-id' | 'passport' | 'driving-license';
    number: string;
    issueDate: string;
    expiryDate: string;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
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
      }
    },
    medicalInfo: {
      bloodType: 'unknown',
      height: '',
      weight: '',
      allergies: [],
      currentMedications: [],
      chronicConditions: [],
      pastSurgeries: []
    },
    insuranceInfo: {
      providerName: '',
      policyNumber: '',
      groupNumber: '',
      insuranceType: 'private',
      validUntil: '',
      coverageDetails: ''
    },
    identification: {
      type: 'national-id',
      number: '',
      issueDate: '',
      expiryDate: ''
    }
  });

  // Temporary states for adding items
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

  // Steps configuration with icons
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
      
      // If no user, redirect to sign in
      if (!currentUser) {
        router.push('/sign-in');
      } else {
        // Check if already completed onboarding
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

  // Handle input changes
  const handleInputChange = (section: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section: keyof FormData, parent: string, field: string, value: any) => {
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

  // Submit form
  const handleSubmit = async () => {
    if (!user || !user.email) {
      setError('Please sign in first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Format past surgeries
      const formattedSurgeries = formData.medicalInfo.pastSurgeries.map(surgery => ({
        name: surgery.name,
        year: parseInt(surgery.year) || 0
      }));

      // Prepare data for saving
      const dataToSave = {
        personalInfo: formData.personalInfo,
        medicalInfo: {
          ...formData.medicalInfo,
          height: parseFloat(formData.medicalInfo.height) || 0,
          weight: parseFloat(formData.medicalInfo.weight) || 0,
          pastSurgeries: formattedSurgeries
        },
        insuranceInfo: formData.insuranceInfo,
        identification: formData.identification
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

  // Skip onboarding
  const skipOnboarding = async () => {
    if (!user || !user.email) {
      setError('Please sign in first');
      return;
    }

    setSubmitting(true);
    try {
      await PatientService.savePatientProfile(user.uid, user.email, {
        personalInfo: {
          firstName: 'User',
          lastName: '',
          dateOfBirth: '',
          gender: 'prefer-not-to-say',
          phoneNumber: '',
          emergencyContact: {
            name: '',
            relationship: '',
            phoneNumber: ''
          }
        }
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError('Failed to skip onboarding: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center  from-background via-background to-muted/50">
        <div className="text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10  pt-24   px-4 from-background via-background to-muted/50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold ">
            Welcome to <span className="font-bold bg-gradient-to-r from-[#03c4f5] to-[#023ec8] bg-clip-text text-transparent">Medora</span>.
          </h1>
          <p className="text-muted-foreground  text-lg">Let's set up your medical profile</p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className=" relative">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted -z-10">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
          
          {/* Progress steps */}
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
          
          {/* Progress percentage */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
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
        <Card className="border-0 ">
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
                      className="h-12 border-none dark:bg-neutral-900 "
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      placeholder="Doe"
                      className="h-12 border-none dark:bg-neutral-900"
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
                      className="h-12 border-none dark:bg-neutral-900"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select
                      value={formData.personalInfo.gender}
                      onValueChange={(value: any) => handleInputChange('personalInfo', 'gender', value)}
                    >
                      <SelectTrigger className="h-12 py-5 border-none dark:bg-neutral-900">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent
                       className='bg-neutral-900 border-none'
                      >
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
                    placeholder="+1(555) 123-4567"
                    className="h-12  border-none dark:bg-neutral-900"
                  />
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="emergencyName" className="text-sm font-medium">Contact Name *</Label>
                      <Input
                        id="emergencyName"
                        value={formData.personalInfo.emergencyContact.name}
                        onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'name', e.target.value)}
                        placeholder="Jane Smith"
                        className="h-12 border-none dark:bg-neutral-900"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="relationship" className="text-sm font-medium">Relationship *</Label>
                      <Input
                        id="relationship"
                        value={formData.personalInfo.emergencyContact.relationship}
                        onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'relationship', e.target.value)}
                        placeholder="Spouse, Parent, etc."
                        className="h-12 border-none dark:bg-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="emergencyPhone" className="text-sm font-medium">Emergency Phone Number *</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.personalInfo.emergencyContact.phoneNumber}
                      onChange={(e) => handleNestedChange('personalInfo', 'emergencyContact', 'phoneNumber',e.target.value)}
                      placeholder="+1 (555) 987-6543"
                      className="h-12 border-none dark:bg-neutral-900"
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
                      <SelectTrigger className="h-12">
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
                      placeholder="17 border-none dark:bg-neutral-9000"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.medicalInfo.weight}
                      onChange={(e) => handleInputChange('medicalInfo', 'weight', e.target.value)}
                      placeholder="70 border-none dark:bg-neutral-900"
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Allergies (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tempAllergy}
                      onChange={(e) => setTempAllergy(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                      placeholder="Enter allergy (e.g., Penicillin)"
                      className="h-12 border-none dark:bg-neutral-900"
                    />
                    <Button 
                      type="button" 
                      onClick={addAllergy} 
                      variant="outline"
                      className="h-12 px-6"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.medicalInfo.allergies.map((allergy, index) => (
                      <Badge key={index} variant="secondary" className="gap-2 px-3 py-1.5">
                        {allergy}
                        <button
                          type="button"
                          onClick={() => removeAllergy(index)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Chronic Conditions (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tempCondition}
                      onChange={(e) => setTempCondition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                      placeholder="Enter condition (e.g., Diabetes)"
                      className="h-12 border-none dark:bg-neutral-900"
                    />
                    <Button 
                      type="button" 
                      onClick={addCondition} 
                      variant="outline"
                      className="h-12 px-6"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.medicalInfo.chronicConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="gap-2 px-3 py-1.5">
                        {condition}
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Insurance Details */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="providerName" className="text-sm font-medium">Insurance Provider</Label>
                  <Input
                    id="providerName"
                    value={formData.insuranceInfo.providerName}
                    onChange={(e) => handleInputChange('insuranceInfo', 'providerName', e.target.value)}
                    placeholder="e.g., Blue Cross"
                    className="h-12 border-none dark:bg-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="policyNumber" className="text-sm font-medium">Policy Number</Label>
                    <Input
                      id="policyNumber"
                      value={formData.insuranceInfo.policyNumber}
                      onChange={(e) => handleInputChange('insuranceInfo', 'policyNumber', e.target.value)}
                      placeholder="e.g., BCBS123456789"
                      className="h-12 border-none dark:bg-neutral-900"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="groupNumber" className="text-sm font-medium">Group Number (Optional)</Label>
                    <Input
                      id="groupNumber"
                      value={formData.insuranceInfo.groupNumber}
                      onChange={(e) => handleInputChange('insuranceInfo', 'groupNumber', e.target.value)}
                      className="h-12  border-none dark:bg-neutral-900 "
                    />
                 </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="insuranceType" className="text-sm font-medium">Insurance Type</Label>
                  <Select
                    value={formData.insuranceInfo.insuranceType}
                    onValueChange={(value: any) => handleInputChange('insuranceInfo', 'insuranceType', value)}
                  >
                    <SelectTrigger className="h-12">
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
                  <Label htmlFor="validUntil" className="text-sm font-medium">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.insuranceInfo.validUntil}
                    onChange={(e) => handleInputChange('insuranceInfo', 'validUntil', e.target.value)}
                    className="h-12 border-none dark:bg-neutral-900"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Identification */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="idType" className="text-sm font-medium">Identification Type</Label>
                  <Select
                    value={formData.identification.type}
                    onValueChange={(value: any) => handleInputChange('identification', 'type', value)}
                  >
                    <SelectTrigger className="h-12">
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
                  <Label htmlFor="idNumber" className="text-sm font-medium">Identification Number</Label>
                  <Input
                    id="idNumber"
                    value={formData.identification.number}
                    onChange={(e) => handleInputChange('identification', 'number', e.target.value)}
                    placeholder="e.g., A12345678"
                    className="h-12 border-none dark:bg-neutral-900"
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
                      className="h-12 border-none dark:bg-neutral-900"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date (Optional)</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.identification.expiryDate}
                      onChange={(e) => handleInputChange('identification', 'expiryDate', e.target.value)}
                      className="h-12 border-none dark:bg-neutral-900"
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
                    Review your information before submitting.
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
                    </CardContent>
                  </Card>
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
            <div className="flex justify-between mt-10 pt-8 ">
              <div>
                {currentStep > 0 && (
                  <Button
                    onClick={prevStep}
                    disabled={submitting}
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
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? 'Saving...' : 'Complete Setup'}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Skip Option */}
            {currentStep === 0 && (
              <div className="text-center mt-6">
                <Button
                  onClick={skipOnboarding}
                  disabled={submitting}
                  variant="link"
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}