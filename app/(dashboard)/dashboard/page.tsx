'use client'
import ProtectedRoute from '@/components/protectedRoutes/protectedRoutes'
import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/firebase/auth'
import React from 'react'
import { toast } from 'sonner'

const Dashboard = () => {
  const handleLogout = async () => {
     try {
        await signOutUser()
         window.location.href = '/sign-in';
          toast.success("Admin logged out successfully");
     } catch (error) {
         toast.error(`Admin Logout Failed: ${error}`);
      console.error(`Logout Failed: ${error}`);
     }
  }
  return (
   <ProtectedRoute>
     <div>
        <Button
         variant={'default'}
        onClick={handleLogout}>
            Logout
        </Button>
    </div>
   </ProtectedRoute>
  )
}

export default Dashboard