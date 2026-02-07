"use client"
import AuthLayout from '@/components/layouts/auth/authlayout'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { LOGO } from '@/public/logo/logo';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  directLogin,
  loginWithGoogle,
  loginWithOTP,
  verifyOTPAndLogin,
  resendOTP,
  resetPassword // Updated to use resetPassword function
} from '@/lib/firebase/auth'

const SignIn = () => {
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null)
  const [storedPassword, setStoredPassword] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if coming from registration
  const registeredEmail = searchParams.get('email')
  const justRegistered = searchParams.get('registered')
  
  React.useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail)
      setSuccess("Registration successful! Please sign in below.")
    }
  }, [registeredEmail])

  // Direct login with email/password (Firebase)
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await directLogin(email, password)

      if (result.success && result.user) {
        toast.success("Signed in successfully!")
        
        // Store user data in localStorage (optional)
        if (result.authUser) {
          localStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified,
            hasCompletedOnboarding: !result.needsOnboarding
          }))
        }
        
        // Redirect based on onboarding status
        if (result.needsOnboarding) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }

      } else {
        throw new Error(result.error || "Sign in failed")
      }

    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific Firebase errors
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('wrong-password') ||
          error.message.includes('invalid-credential')) {
        setError("Invalid email or password. Please try again.")
      } else if (error.message.includes('rate limit') || error.message.includes('too-many-requests')) {
        setError("Too many attempts. Please try again later.")
      } else if (error.message.includes('not verified')) {
        setError("Please verify your email before logging in.")
      } else if (error.message.includes('user-not-found')) {
        setError("No account found with this email.")
      } else if (error.message.includes('user-disabled')) {
        setError("This account has been disabled.")
      } else {
        setError(error.message || "Login failed. Please check your credentials.")
      }
      
      toast.error("Login failed")
    } finally {
      setLoading(false)
    }
  }

  // Start OTP login flow (Firebase custom implementation)
  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setGeneratedOTP(null)

    try {
      // Use Firebase OTP login function
      const result = await loginWithOTP(email, password)
      
      if (result.success && result.otp) {
        // Store password for OTP verification
        setStoredPassword(password)
        
        // In development, show the OTP (would be sent via email in production)
        setGeneratedOTP(result.otp)
        setSuccess(`OTP sent to ${email}`)
        setStep('otp')
        
        toast.info("Check the OTP in the yellow box (demo mode)")

      } else {
        throw new Error(result.error || "Failed to send OTP")
      }

    } catch (error: any) {
      console.error('OTP request error:', error)
      setError(error.message || "Login failed. Please check your credentials.")
      toast.error("Login failed")
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP with Firebase
  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Verify OTP with Firebase
      const result = await verifyOTPAndLogin(email, storedPassword, otp)
      
      if (result.success && result.user) {
        toast.success("Login successful!")
        
        // Store user data
        if (result.authUser) {
          localStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified,
            hasCompletedOnboarding: !result.needsOnboarding
          }))
        }
        
        // Redirect based on onboarding status
        if (result.needsOnboarding) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
        
      } else {
        throw new Error(result.error || "Invalid OTP or credentials")
      }

    } catch (error: any) {
      console.error('OTP verification error:', error)
      setError(error.message || "Invalid OTP. Please try again.")
      toast.error("OTP verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    setError(null)

    try {
      // Resend OTP with Firebase
      const result = await resendOTP(email, storedPassword)
      
      if (result.success && result.otp) {
        setGeneratedOTP(result.otp)
        setSuccess("New OTP sent!")
        toast.success("OTP regenerated")

      } else {
        throw new Error(result.error || "Failed to resend OTP")
      }

    } catch (error: any) {
      console.error('Resend OTP error:', error)
      setError(error.message || "Failed to resend OTP")
      toast.error("Failed to resend OTP")
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      // Firebase Google OAuth
      const result = await loginWithGoogle()
      
      if (result.success && result.user) {
        toast.success("Signed in with Google!")
        
        // Store user data
        if (result.authUser) {
          localStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified,
            hasCompletedOnboarding: !result.needsOnboarding
          }))
        }
        
        // Redirect based on onboarding status
        if (result.needsOnboarding) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
        
      } else {
        throw new Error(result.error || "Google sign-in failed")
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      
      if (error.message.includes('cancelled') || error.message.includes('popup-closed')) {
        setError("Sign-in was cancelled.")
      } else {
        setError(error.message || "Failed to sign in with Google")
        toast.error("Google sign-in failed")
      }
      
      setGoogleLoading(false)
    }
  }

  // Forgot password handler with Firebase
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Use the resetPassword function from firebase-auth-utils
      const result = await resetPassword(email)
      
      if (result.success) {
        toast.success("Password reset email sent!")
        setSuccess("Check your email for password reset instructions")
      } else {
        throw new Error(result.error || "Failed to send password reset email")
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      setError(error.message || "Failed to send password reset email")
      toast.error("Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  // Determine which form to show based on step
  const renderLoginForm = () => (
    <form onSubmit={handleDirectLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          required
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full py-6 border-none bg-neutral-900"
        />
      </div>
     
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          required
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full py-6 border-none bg-neutral-900"
          minLength={6}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-right">
          <Button
            type="button"
            variant="link"
            onClick={handleForgotPassword}
            disabled={loading || !email}
            className="text-blue-400 hover:text-blue-300 p-0 h-auto text-sm"
          >
            Forgot password?
          </Button>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          onClick={handleOTPRequest}
          disabled={loading || !email || !password}
          className="text-sm"
        >
          Login with OTP
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#6ecef2] text-black hover:text-white hover:bg-blue-700 py-4 disabled:opacity-50"
        disabled={loading || !email || !password}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Signing in...
          </span>
        ) : 'Sign In'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background">Or, log in with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
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
            Sign in with Google
          </>
        )}
      </Button>

      <div className="text-center">
        <p className="">
          Don't have an account?{" "}
          <Link href="/sign-up">
            <Button
              variant="link"
              className="text-[#6ecef2] hover:text-blue-300 p-0 h-auto font-medium"
            >
              Register
            </Button>
          </Link>
        </p>
      </div>
    </form>
  )

  const renderOTPForm = () => (
    <form onSubmit={handleOTPVerify} className="space-y-6">
      <div className="text-center">
        <p className="text-gray-400 mb-2">Enter OTP sent to</p>
        <p className="font-medium text-blue-300 mb-6">{email}</p>
        
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-sm font-medium">
            6-digit OTP
          </Label>
          <Input
            id="otp"
            type="text"
            value={otp}
            required
            disabled={loading}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter OTP"
            className="w-full py-6 border-none bg-neutral-900 text-center text-xl tracking-widest"
            maxLength={6}
            pattern="\d{6}"
            inputMode="numeric"
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <Button
            type="button"
            variant="link"
            onClick={handleResendOTP}
            disabled={resendLoading || loading}
            className="text-blue-400"
          >
            {resendLoading ? 'Resending...' : 'Resend OTP'}
          </Button>
          <p className="text-xs text-gray-500">
            OTP is valid for 10 minutes
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep('login')
            setOtp('')
            setGeneratedOTP(null)
            setStoredPassword('')
          }}
          className="flex-1 py-6"
          disabled={loading}
        >
          Back to Login
        </Button>
        
        <Button
          type="submit"
          className="flex-1 bg-[#6ecef2] text-black hover:bg-blue-600 hover:text-white py-6"
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </span>
          ) : 'Verify OTP'}
        </Button>
      </div>
    </form>
  )

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto border-0 relative bg-none shadow-none">
        <CardHeader className="text-center space-y-2">
          <Image
            alt='Medora Logo'
            src={LOGO.MEDORA_LOGO}
            className='h-24 w-24 fixed top-1 right-0'
          />
          <CardTitle className="text-3xl md:text-4xl font-bold">
            {step === 'login' ? `Welcome back` : 'Enter OTP'}
          </CardTitle>
          <CardDescription>
            {step === 'login' ? 'Sign in to access your account' : 'Enter the OTP sent to your email'}
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
            </div>
          )}

          {/* Development OTP Display - Only show in development */}
          {process.env.NODE_ENV === 'development' && generatedOTP && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-600 text-sm text-center font-bold">
                🚨 DEVELOPMENT MODE: OTP is {generatedOTP}
              </p>
              <p className="text-yellow-600 text-xs text-center mt-1">
                (In production, OTP would be sent via email)
              </p>
            </div>
          )}

          {step === 'login' ? renderLoginForm() : renderOTPForm()}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default SignIn