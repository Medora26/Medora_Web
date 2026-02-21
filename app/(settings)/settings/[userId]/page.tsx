'use client'

import React from 'react'
import { useAuth } from '@/context/auth/authContext'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ChevronLeft
} from 'lucide-react'
import Link from 'next/link'

const Page = () => {
  const { user } = useAuth()
  const params = useParams()
  const userId = params.userId

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

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 ">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

     
      </div>
    </DashboardLayout>
  )
}

export default Page