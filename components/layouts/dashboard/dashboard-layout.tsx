import ProtectedRoute from '@/components/protectedRoutes/protectedRoutes'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import React, { ReactNode } from 'react'
import AppSidebar from './components/appsidebar'
interface DashboardLayoutProps {
     children: ReactNode
}
const DashboardLayout = ({children}:DashboardLayoutProps) => {
  return (
    <ProtectedRoute>
         <SidebarProvider>
        
        <AppSidebar  />
        <SidebarInset>
        
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}

export default DashboardLayout