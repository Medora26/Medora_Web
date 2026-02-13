'use client'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import ProtectedRoute from '@/components/protectedRoutes/protectedRoutes'
import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/firebase/service/auth'
import React from 'react'
import { toast } from 'sonner'

const Dashboard = () => {
  const handleLogout = async () => {
     try {
        await signOutUser()
         window.location.href = '/sign-in';
          toast.success("Admin logged out successfully");
     } catch (error) {
         toast.error(`Logout: ${error}`);
      console.error(`Logout Failed: ${error}`);
     }
  }
  return (
   
  <DashboardLayout>
    hi
  </DashboardLayout>
  
  )
}

export default Dashboard