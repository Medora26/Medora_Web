'use client';

import { useState, useEffect } from 'react';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/navbar';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    if (code) setOobCode(code);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);

      setTimeout(() => {
        window.location.href = 'medoraapp://reset-success';

        setTimeout(() => {
          alert('Password reset successful! Please return to the Medora app.');
        }, 500);
      }, 1200);
    } catch (error: any) {
      if (error.code === 'auth/expired-action-code') {
        setError('Reset link has expired. Request a new one.');
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col px-2">
      
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative">

        {/* Subtle theme-based gradient background */}
        <div className="absolute inset-0 -z-10 " />

        <Card className="w-full max-w-md backdrop-blur-sm">
          
          {success ? (
            <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
              
              <div className="rounded-full p-3 border">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>

              <h2 className="text-xl font-semibold">
                Password updated
              </h2>

              <p className="text-sm text-muted-foreground">
                You can now sign in with your new password.
              </p>

              <Button
                className="w-full"
                onClick={() => (window.location.href = 'medoraapp://reset-success')}
              >
                Open Medora App
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">
                  Reset password
                </CardTitle>
                <CardDescription>
                  Enter a new password to continue
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  
                  {/* Password */}
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Confirm */}
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  {/* Error */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Button */}
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 text-white hover:bg-blue-600 hover:texxt-white cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Reset password'}
                  </Button>

                  {/* Footer */}
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Secure password reset • Medora
                  </p>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}