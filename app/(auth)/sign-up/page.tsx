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
const SignUp = () => {
  const [error, setError] = useState<string | null>(null)
  const [passwordShow, setPasswordShow] = useState(false)
  return (
   <AuthLayout>
      <Card className="w-full max-w-md mx-auto border-0 relative  bg-none shadow-none">
      <CardHeader className="text-center relative space-y-2">
        <Image
         alt=''
         src={LOGO.MEDORA_LOGO}
         className='h-24 w-24 fixed -top-3  -right-2 '
        />
        <CardTitle className="text-3xl md:text-4xl font-bold ">
         Register yourself to MEDORA
        </CardTitle>
        <CardDescription className="">
          Sign In to Manage Your Documents
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3  border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        <form /* onSubmit={handleEmailLogin} */ className="space-y-6">
          {/* username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium ">
              Username
            </Label>
            <Input
              id="username"
              type="text"
             /*  value={email} */
              required
             /*  disabled={loading} */
             /*  onChange={(e) => setEmail(e.target.value)} */
              placeholder="yahiko"
              className="w-full py-6 border-none bg-neutral-900"
            />
          </div>
         {/* email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium ">
              Email
            </Label>
            <Input
              id="email"
              type="email"
             /*  value={email} */
              required
             /*  disabled={loading} */
             /*  onChange={(e) => setEmail(e.target.value)} */
              placeholder="subhrokolay2@gmail.com"
              className="w-full py-6 border-none bg-neutral-900"
            />
          </div>

          {/* Password */}
         <div className="space-y-2">
  <Label htmlFor="password" className="text-sm font-medium">
    Password
  </Label>

  <div className="relative">
    <Input
      id="password"
      placeholder="••••••••"
      className="w-full py-6 border-none bg-neutral-900 pr-10"
      minLength={8}
    />

    <button
      type="button"
      onClick={() => setPasswordShow(!passwordShow)}
      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
      aria-label={passwordShow ? "Hide password" : "Show password"}
    >
      {passwordShow ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>
</div>


          {/* Login Button */}
          <Button
            type="submit"
            className="w-full bg-[#6ecef2] text-black hover:text-white hover:bg-blue-700  py-3 disabled:opacity-50"
           /*  disabled={loading} */
          >
             Login
           {/*  {loading ? 'Verifying Access...' : 'LOGIN'} */}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2  ">
                Or, log in with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full py-3 disabled:opacity-50"
            
           /*  disabled={loading} */
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="">
              Already have an account ?{" "}
             <Link href="/sign-in">
              <Button
                variant="link"
                className="text-[#6ecef2] hover:text-blue-400 p-0 h-auto font-medium disabled:opacity-50"
               /*  disabled={loading} */
              >
                Login
              </Button>
             </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
   </AuthLayout>
  )
}

export default SignUp