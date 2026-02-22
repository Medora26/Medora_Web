// app/[userId]/settings/page.tsx
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth/authContext'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Bell, 
  Shield, 
  HardDrive, 
  Palette,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { toast } from 'sonner'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'

const Page = () => {
  const { user, isOnboardingComplete, refreshOnboardingStatus } = useAuth()
  const params = useParams()
  const userId = params.userId

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password change state
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  // Show/hide sensitive info
  const [showEmail, setShowEmail] = useState(false)

  // Notification preferences (example)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  // Loading state for user data
  const [userData, setUserData] = useState<any>(null)
  const [loadingUserData, setLoadingUserData] = useState(true)

  // Fetch additional user data
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            setUserData(userDoc.data())
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        } finally {
          setLoadingUserData(false)
        }
      }
    }

    fetchUserData()
  }, [user])

  // If the logged-in user doesn't match the URL userId, show access denied
  if (user?.uid !== userId) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-6">
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You don't have permission to access this user's settings.
                </p>
                <Link href="/dashboard">
                  <Button>Return to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsUpdatingProfile(true)
    
    try {
      // Update Firebase Auth profile
      if (user.displayName !== displayName) {
        await updateProfile(user, {
          displayName: displayName
        })
      }
      
      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        username: displayName,
        updatedAt: new Date()
      })
      
      toast.success('Profile updated successfully!', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.', {
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!user?.email) return
    
    setIsSendingReset(true)
    
    try {
      await sendPasswordResetEmail(auth, user.email)
      setResetEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      })
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      toast.error('Failed to send reset email. Please try again.', {
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setIsSendingReset(false)
    }
  }

  // Handle onboarding completion
  const handleCompleteOnboarding = async () => {
    if (!user) return
    
    try {
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        hasCompletedOnboarding: true,
        updatedAt: new Date()
      })
      
      // Refresh the onboarding status in context
      await refreshOnboardingStatus()
      
      toast.success('Onboarding completed! Welcome to Medora!', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      })
    } catch (error) {
      toast.error('Failed to update onboarding status')
    }
  }

  if (loadingUserData) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Onboarding Alert - Show if user hasn't completed onboarding */}
        {!isOnboardingComplete && (
          <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>Complete your profile setup to get the most out of Medora.</span>
              <Button size="sm" onClick={handleCompleteOnboarding}>
                Complete Setup
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Profile Information Card */}
            <Card className='border-none'>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your images fetch from your provider accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4">
                  {
                    user?.photoURL ? (
                    <Image
                        width={52}
                        height={52}
                        alt={user?.displayName || 'User avatar'}
                        src={user.photoURL}
                        className='rounded-full object-cover'
                    />
                    ) : (
                        <User className='w-4 h-4' />
                    )
                }
                  <div>
                    <p className="text-sm text-muted-foreground">Profile picture</p>
                    <p className="text-xs text-muted-foreground">
                      Avatar is automatically generated from your display name
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="email"
                        type={showEmail ? "text" : "password"}
                        value={user?.email || ''}
                        disabled
                        className="bg-muted border-none"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowEmail(!showEmail)}
                        className="h-10 w-10"
                      >
                        {showEmail ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      className='border-none'
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      value={user?.uid || ''}
                      disabled
                      className="bg-muted font-mono text-xs border-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <Input
                      value={userData?.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      disabled
                      className="bg-muted border-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Verification</Label>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user?.emailVerified 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {user?.emailVerified ? 'Verified' : 'Not Verified'}
                      </div>
                      {!user?.emailVerified && (
                        <Button variant="outline" size="sm">
                          Resend Verification
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isUpdatingProfile || displayName === user?.displayName}
                    className="gap-2"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className='border-none'>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  We'll send a password reset link to your email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resetEmailSent ? (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-600 dark:text-green-400">
                      Password reset email sent! Check your inbox and follow the instructions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to receive a password reset link at:{' '}
                      <span className="font-medium text-foreground">{user?.email}</span>
                    </p>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={isSendingReset}
                      variant="outline"
                    >
                      {isSendingReset ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
              {resetEmailSent && (
                <CardFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setResetEmailSent(false)}
                    className="text-sm"
                  >
                    Send another email
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how Medora looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Theme preferences will be added here (Light/Dark/System mode).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what updates you want to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates and alerts via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time alerts in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle>Storage Management</CardTitle>
                <CardDescription>
                  Manage your documents and storage usage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Storage statistics and management will be added here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default Page