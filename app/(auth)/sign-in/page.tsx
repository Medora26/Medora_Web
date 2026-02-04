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
import { useRouter } from 'next/navigation';
import { loginWithOTP, verifyOTPAndLogin, loginWithGoogle, resendOTP } from '@/lib/firebase/auth';
import { toast } from 'sonner';

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
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null) // For development display
  
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setGeneratedOTP(null)

    try {
      const result = await loginWithOTP(email, password)

      if(result.success) {
        setSuccess(`OTP sent to ${email}`)
        setGeneratedOTP(result.otp || null) // Store OTP for display
        setStep('otp')
      } else {
        setError(result.error || "Login failed")
      }
    } catch (error: any) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await verifyOTPAndLogin(email, password, otp)

      if(result.success) {
        toast.success("Login successful!")
        
        // Redirect based on onboarding status
        setTimeout(() => {
          if(result.needsOnboarding) {
            window.location.href = '/onboarding'
          } else {
            window.location.href = '/dashboard'
          }
        }, 1000)
        
      } else {
        setError(result.error || "Invalid OTP. Please try again.")
        setLoading(false)
      }
    } catch (error: any) {
      setError("OTP verification failed")
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    setError(null)

    try {
      const result = await resendOTP(email, password)

      if(result.success) {
        setSuccess("New OTP sent!")
        setGeneratedOTP(result.otp || null) // Update displayed OTP
      } else {
        setError("Failed to resend OTP")
      }
    } catch (error: any) {
      setError("Failed to resend OTP")
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const result = await loginWithGoogle()

      if(result.success) {
        toast.success("Signed in with Google!")
        
        setTimeout(() => {
          if(result.needsOnboarding) {
            window.location.href = '/onboarding'
          } else {
            window.location.href = '/dashboard'
          }
        }, 1000)
        
      } else {
        setError(result.error || "Google sign-in failed")
        setGoogleLoading(false)
      }
    } catch (error: any) {
      setError("An unexpected error occurred")
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto border-0 relative bg-none shadow-none">
        <CardHeader className="text-center space-y-2">
          <Image
            alt='Medora Logo'
            src={LOGO.MEDORA_LOGO}
            className='h-24 w-24 fixed -top-3 -right-2'
          />
          <CardTitle className="text-3xl md:text-4xl font-bold">
            {step === 'login' ? 'Welcome Back' : 'Enter OTP'}
          </CardTitle>
          <CardDescription>
            {step === 'login' ? 'Sign in to access your account' : 'Check your email for OTP'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-500 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Development OTP Display */}
          {generatedOTP && process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-600 text-sm text-center font-bold">
                🚨 DEVELOPMENT MODE: OTP is {generatedOTP}
              </p>
              <p className="text-yellow-600 text-xs text-center mt-1">
                (In production, OTP would be sent to email)
              </p>
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="••••••••"
                  className="w-full py-6 border-none bg-neutral-900"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#6ecef2] text-black hover:text-white hover:bg-blue-700 py-3 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2">Or, log in with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full py-6 disabled:opacity-50"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? 'Signing in...' : (
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
          ) : (
            <form onSubmit={handleOTPVerify} className="space-y-6">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Enter the OTP sent to</p>
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
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full py-6 border-none bg-neutral-900 text-center text-xl"
                    maxLength={6}
                  />
                </div>
                
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={resendLoading || loading}
                    className="text-blue-400"
                  >
                    {resendLoading ? 'Resending...' : 'Resend OTP'}
                  </Button>
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
                  }}
                  className="flex-1 py-6"
                  disabled={loading}
                >
                  Back
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 bg-[#6ecef2] text-black hover:bg-blue-600 hover:text-white py-6"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default SignIn