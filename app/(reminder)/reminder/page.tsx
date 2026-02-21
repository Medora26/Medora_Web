import Dashboard from '@/app/(dashboard)/dashboard/page'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import React from 'react'

const page = () => {
  return (
    <DashboardLayout>
        <div className="flex-1 space-y-6 p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointment reminder</h1>
            <p className="text-muted-foreground">
              You can set your future doctor appointments.
            </p>
          </div>
        </div>

     
      </div>
    </DashboardLayout>
  )
}

export default page