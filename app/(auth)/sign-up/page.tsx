"use client"
import AuthLayout from '@/components/layouts/auth/authlayout'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { LOGO } from '@/public/logo/logo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  signUpUser,
  loginWithGoogle,
  directLogin
} from '@/lib/firebase/auth'; // Updated import path

const SignUp = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [passwordShow, setPasswordShow] = useState(false)
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const validateForm = (): boolean => {
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    
    if (formData.password.length < 6) { // Firebase requires min 6 chars
      setError("Password must be at least 6 characters long")
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    
    if (formData.fullname.length < 2) {
      setError("Please enter your full name")
      return false
    }
    
    if (formData.fullname.length > 255) {
      setError("Full name must be less than 255 characters")
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Attempting Firebase signup with:', {
        email: formData.email,
        fullname: formData.fullname
      });

      // Use Firebase signUpUser function
      const result = await signUpUser(
        formData.email,
        formData.password,
        formData.fullname
      );

      console.log('Signup result:', result);

      if (result.success && result.user) {
        setSuccess("Account created successfully! Please check your email to verify your account.");
        toast.success("Welcome to Medora!");
        
        // Note: Firebase automatically sends verification email in signUpUser function
        
        // Clear form
        setFormData({
          fullname: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

        // Try auto-login after signup
        try {
          const loginResult = await directLogin(formData.email, formData.password);
          
          if (loginResult.success) {
            toast.success("Account created and logged in!");
            
            // Check if user needs onboarding
            if (loginResult.needsOnboarding) {
              setTimeout(() => {
                router.push('/onboarding');
              }, 2000);
            } else {
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            }
          } else {
            console.log("Auto-login failed, redirecting to sign-in");
            toast.info("Please sign in with your new account");
            
            setTimeout(() => {
              router.push('/sign-in');
            }, 3000);
          }

        } catch (loginError) {
          console.log("Auto-login error, redirecting to sign-in:", loginError);
          
          setTimeout(() => {
            router.push('/sign-in');
          }, 3000);
        }

      } else {
        throw new Error(result.error || "Registration failed");
      }

    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle specific Firebase error cases
      if (error.message.includes('already registered') || 
          error.message.includes('already exists') ||
          error.message.includes('email already') ||
          error.message.includes('email-already-in-use')) {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (error.message.includes('Invalid email')) {
        setError("Please enter a valid email address.");
      } else if (error.message.includes('password') || error.message.includes('weak-password')) {
        setError("Password should be at least 6 characters long.");
      } else if (error.message.includes('rate limit') || error.message.includes('too-many-requests')) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(error.message || "An error occurred during sign up");
      }
      
      toast.error("Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    toast.info("Signing in with Google...");

    try {
      // Firebase Google OAuth
      const result = await loginWithGoogle();
      
      if (result.success && result.user) {
        toast.success("Signed in with Google!");
        
        // Check if user needs onboarding
        if (result.needsOnboarding) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(result.error || "Google sign-in failed");
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      if (error.message.includes('cancelled') || error.message.includes('popup-closed')) {
        setError("Sign-in was cancelled.");
      } else {
        setError(error.message || "Failed to sign in with Google");
        toast.error("Google sign-in failed");
      }
      
      setGoogleLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto border-0 relative bg-none shadow-none">
        <CardHeader className="text-center relative ">
          <Image
            alt='Medora Logo'
            src={LOGO.MEDORA_LOGO}
            className='h-24 w-24 fixed top-1 right-0'
          />
          <CardTitle className="text-3xl md:text-4xl font-bold">
            Smarter care with Medora
          </CardTitle>
          <CardDescription className="text-md">
            Create and experience intelligent health tracking.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-500 text-sm text-center font-medium">{success}</p>
              <p className="text-blue-500 text-xs text-center mt-1 animate-pulse">
                Please wait, redirecting...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullname"
                  type="text"
                  value={formData.fullname}
                  required
                  disabled={loading}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full py-6 border-none bg-neutral-900"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500">Maximum 255 characters</p>
              </div>
             
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  required
                  disabled={loading}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="w-full py-6 border-none bg-neutral-900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordShow ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password (min. 6 characters)"
                    className="w-full py-6 border-none bg-neutral-900 pr-10"
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordShow(!passwordShow)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    aria-label={passwordShow ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {passwordShow ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimum 6 characters (Firebase requirement)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={passwordShow ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter your password"
                    className="w-full py-6 border-none bg-neutral-900 pr-10"
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  disabled={loading}
                  className="h-4 w-4 mb-1 text-blue-600 rounded disabled:opacity-50"
                />
                <p className='font-medium text-xs'>
                  I agree to Medora's <span className='text-blue-400 font-semibold'>Terms & Conditions</span> 
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#6ecef2] text-black hover:bg-blue-600 hover:text-white py-4 text-md disabled:opacity-50 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background ">
                  Already have an account?{' '}
                  <Link 
                    href="/sign-in" 
                    className="text-blue-400 hover:underline transform transition-all duration-200 hover:text-blue-300"
                  >
                    Login
                  </Link>
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant={'ghost'}
              className="w-full py-4 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                  Signing in...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </>
              )}
            </Button>

            <div className="text-center text-xs text-gray-500">
              <p>By signing up, you agree to our Privacy Policy and Terms of Service.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default SignUp;