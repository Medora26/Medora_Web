'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Globe2, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ContactFormDataProps, ContactFormErrorProps, ContactFormProps } from '@/types/contact/types';
import { saveCollaborator } from '@/lib/firebase/service/contact/service';




const roleIcons = {
  'developer': '💻',
  'content-creator': '📝',
  'digital-marketer': '📈',
  'designer': '🎨',
};

const roleDescriptions = {
  'developer': 'Build scalable solutions and craft elegant code',
  'content-creator': 'Tell stories that resonate with our audience',
  'digital-marketer': 'Drive growth and engage communities',
  'designer': 'Create beautiful, intuitive experiences',
};

export function ContactForm({ onLocationSubmit, isGlobeAnimating }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormDataProps>({
    fullName: '',
    email: '',
    role: '',
    location: '',
    experience: '',
    portfolio: '',
    message: '',
    acceptedTerms: false,
  });

  const [errors, setErrors] = useState<ContactFormErrorProps>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  const [formProgress, setFormProgress] = useState(0);

  // Calculate form progress
  useEffect(() => {
    const requiredFields = ['fullName', 'email', 'role', 'location', 'experience', 'message', 'acceptedTerms'];
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof ContactFormDataProps];
      return value && (typeof value !== 'boolean' ? String(value).length > 0 : value === true);
    });
    setFormProgress((filledFields.length / requiredFields.length) * 100);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error for this field when user types
    if (errors[name as keyof ContactFormErrorProps]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as ContactFormDataProps['role'] }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }));
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  const validateField = (fieldName: string): string | undefined => {
    const value = formData[fieldName as keyof ContactFormDataProps];
    
    switch (fieldName) {
      case 'fullName':
        if (!value) return 'Full name is required';
        if (String(value).length < 2) return 'Name must be at least 2 characters';
        if (String(value).length > 50) return 'Name must be less than 50 characters';
        break;
      
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) return 'Please enter a valid email address';
        break;
      
      case 'role':
        if (!value) return 'Please select your role';
        break;
      
      case 'location':
        if (!value) return 'Location is required';
        if (String(value).length < 2) return 'Please enter a valid location';
        break;
      
      case 'experience':
        if (!value) return 'Experience is required';
        break;
      
      case 'message':
        if (!value) return 'Message is required';
        if (String(value).length < 20) return 'Message must be at least 20 characters';
        if (String(value).length > 500) return 'Message must be less than 500 characters';
        break;
      
      case 'portfolio':
        if (value) {
          try {
            new URL(String(value));
          } catch {
            return 'Please enter a valid URL';
          }
        }
        break;
      
      case 'acceptedTerms':
        if (!value) return 'You must accept the terms and conditions';
        break;
    }
    
    return undefined;
  };

  const validateForm = (): boolean => {
    const fieldsToValidate: (keyof ContactFormDataProps)[] = [
      'fullName', 'email', 'role', 'location', 'experience', 'message', 'acceptedTerms'
    ];
    
    const newErrors: ContactFormErrorProps = {};
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleLocationCheck = async () => {
    if (!formData.location || formData.location.length < 2) {
      setLocationError('Please enter a valid location');
      return;
    }

    setIsLocationLoading(true);
    setLocationError('');
    setLocationSuccess('');

    try {
      if (onLocationSubmit) {
        const result = await onLocationSubmit(formData.location);
        if (result) {
          setLocationSuccess(`📍 Found ${result.name}`);
          toast.success('Location found!', {
            description: `We've located you in ${result.name}`,
            duration: 3000,
          });
        } else {
          setLocationError('Location not found. Try "City, Country" format');
          toast.error('Location not found', {
            description: 'Please try a more specific format like "London, UK"',
          });
        }
      }
    } catch (error) {
      setLocationError('Error finding location. Please try again.');
      toast.error('Something went wrong', {
        description: 'Unable to verify your location. Please try again.',
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Mark all fields as touched
  const allFields: (keyof ContactFormDataProps)[] = [
    'fullName', 'email', 'role', 'location', 'experience', 'message', 'acceptedTerms'
  ];
  const touchedFields = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
  setTouched(touchedFields);
  
  if (!validateForm()) {
    toast.error('Please fix the errors in the form');
    return;
  }

  setIsSubmitting(true);

  try {
    // Save to Firebase
const result = await saveCollaborator(formData);
    
    if (result.success) {
      toast.success('Application submitted! 🚀', {
        description: "Thanks for joining Medora. We'll review your application soon.",
        duration: 5000,
      });
      
      console.log('Form submitted with ID:', result.id);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        role: '',
        location: '',
        experience: '',
        portfolio: '',
        message: '',
        acceptedTerms: false,
      });
      setLocationSuccess('');
      setTouched({});
    } else {
      toast.error('Submission failed', {
        description: result.error || 'Something went wrong',
      });
    }
  } catch (error) {
    toast.error('Something went wrong', {
      description: 'Please try again later.',
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const getFieldError = (fieldName: keyof ContactFormDataProps): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-none border-none ">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl md:text-4xl text-center md:text-left font-bold">
              Got Ideas? We'v got the skills. Let's Team up
            </CardTitle>
            <CardDescription className="mt-2">
              Take the first step towards building the future with us
            </CardDescription>
          </div>
          
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-xs">
            <span>Application Progress</span>
            <span>{Math.round(formProgress)}%</span>
          </div>
          <Progress value={formProgress} className="h-1" />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              placeholder="John Doe"
              className={getFieldError('fullName') ? 'border-destructive' : ''}
            />
            {getFieldError('fullName') && (
              <p className="text-sm text-destructive">{getFieldError('fullName')}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="john@example.com"
              className={getFieldError('email') ? 'border-destructive' : ''}
            />
            {getFieldError('email') && (
              <p className="text-sm text-destructive">{getFieldError('email')}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">
              I want to join as a <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role || undefined}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger 
                className={getFieldError('role') ? 'border-destructive' : ''}
                onBlur={() => handleBlur('role')}
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleIcons).map(([value, icon]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <div className="flex flex-col">
                        <span className="capitalize">{value.replace('-', ' ')}</span>
                        <span className="text-xs text-muted-foreground">
                          {roleDescriptions[value as keyof typeof roleDescriptions]}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('role') && (
              <p className="text-sm text-destructive">{getFieldError('role')}</p>
            )}
          </div>

          {/* Location with Globe Integration */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Your Location <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={() => handleBlur('location')}
                  placeholder="e.g., San Francisco, USA"
                  className={getFieldError('location') ? 'border-destructive' : ''}
                />
              </div>
              <Button
                type="button"
                onClick={handleLocationCheck}
                disabled={isLocationLoading || !formData.location}
                variant="secondary"
                className="transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLocationLoading ? (
                  <Loader2 className="h-4 w-4  " />
                ) : (
                  <Globe2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Location Status */}
            {locationError && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                <MapPin className="h-3 w-3" />
                {locationError}
              </div>
            )}
            {locationSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
                <CheckCircle2 className="h-3 w-3" />
                {locationSuccess}
              </div>
            )}
            {isGlobeAnimating && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Globe is flying to your location...
              </div>
            )}
            {getFieldError('location') && (
              <p className="text-sm text-destructive">{getFieldError('location')}</p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">
              Years of Experience <span className="text-destructive">*</span>
            </Label>
            <Input
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              onBlur={() => handleBlur('experience')}
              placeholder="e.g., 3-5 years"
              className={getFieldError('experience') ? 'border-destructive' : ''}
            />
            {getFieldError('experience') && (
              <p className="text-sm text-destructive">{getFieldError('experience')}</p>
            )}
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio">
              Portfolio / LinkedIn / GitHub
            </Label>
            <Input
              id="portfolio"
              name="portfolio"
              type="url"
              value={formData.portfolio}
              onChange={handleChange}
              onBlur={() => handleBlur('portfolio')}
              placeholder="https://..."
              className={getFieldError('portfolio') ? 'border-destructive' : ''}
            />
            {getFieldError('portfolio') && (
              <p className="text-sm text-destructive">{getFieldError('portfolio')}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Why do you want to join Medora? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={() => handleBlur('message')}
              placeholder="Tell us about yourself and why you'd be a great fit..."
              className={`min-h-[120px] ${getFieldError('message') ? 'border-destructive' : ''}`}
            />
            <div className="flex justify-between">
              {getFieldError('message') && (
                <p className="text-sm text-destructive">{getFieldError('message')}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {formData.message.length}/500
              </p>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="acceptedTerms"
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={handleChange}
              onBlur={() => handleBlur('acceptedTerms')}
              className="rounded border-input bg-background text-primary focus:ring-primary"
            />
            <Label htmlFor="acceptedTerms" className="text-sm cursor-pointer">
              I agree to the{' '}
              <a href="/terms" className="text-primary hover:underline underline-offset-2">
                terms and conditions
              </a>{' '}
              <span className="text-destructive">*</span>
            </Label>
          </div>
          {getFieldError('acceptedTerms') && (
            <p className="text-sm text-destructive">{getFieldError('acceptedTerms')}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-semibold py-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 group bg-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                Join the Medora Team
                <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-xs text-muted-foreground text-center">
          ✨ We typically respond within 2-3 business days. All applications are carefully reviewed.
        </p>
      </CardFooter>
    </Card>
  );
}

export default ContactForm;