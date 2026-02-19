export interface ContactFormDataProps {
  fullName: string;
  email: string;
  role: 'developer' | 'content-creator' | 'digital-marketer' | 'designer' | '';
  location: string;
  experience: string;
  portfolio: string;
  message: string;
  acceptedTerms: boolean;
}

export interface ContactFormErrorProps {
  fullName?: string;
  email?: string;
  role?: string;
  location?: string;
  experience?: string;
  portfolio?: string;
  message?: string;
  acceptedTerms?: string;
}
export interface ContactFormProps {
  onLocationSubmit?: (location: string) => Promise<{ lat: number; lng: number; name: string } | null>;
  isGlobeAnimating?: boolean;
}