'use client'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/firebase/service/auth'
import React from 'react'
import { toast } from 'sonner'

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  Upload, 
  Users, 
  FileText,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Clock,
  HardDrive,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const Dashboard = () => {
  const handleLogout = async () => {
    try {
      await signOutUser()
      window.location.href = '/sign-in'
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error(`Logout: ${error}`)
      console.error(`Logout Failed: ${error}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your medical imaging data</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 Days
            </Button>
          
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Studies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                <span className="text-emerald-500">--</span>
                <span className="ml-1">vs last month</span>
              </div>
              {/* API: Fetch total studies count */}
            </CardContent>
          </Card>

          {/* Storage Used */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">571.25 KB</div>
              <p className="text-xs text-muted-foreground mt-1">of 500 MB (0.1%)</p>
              {/* API: Fetch storage usage */}
            </CardContent>
          </Card>

          {/* Uploads This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploads This Month</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Last upload -- hours ago</span>
              </div>
              {/* API: Fetch monthly uploads */}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Study Type Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Studies by Type</span>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['X-Rays', 'MRI Scans', 'CT Scans', 'Ultrasounds', 'Mammograms'].map((type) => (
                  <div key={type} className="flex items-center">
                    <div className="w-24 text-sm">{type}</div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '0%' }} />
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm">--</div>
                  </div>
                ))}
              </div>
              {/* API: Fetch study type distribution */}
            </CardContent>
          </Card>

          {/* Upload Trends */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Upload Activity (Last 7 Days)</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end justify-between gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-muted rounded-t-md" style={{ height: '0px' }} />
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
              {/* API: Fetch weekly upload data */}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Uploads List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>Study_{item}.dcm</span>
                    </div>
                    <span className="text-muted-foreground">-- hours ago</span>
                  </div>
                ))}
              </div>
              {/* API: Fetch recent uploads */}
            </CardContent>
          </Card>

          {/* Storage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Storage by Study Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['X-Rays', 'MRI', 'CT', 'Ultrasound', 'Mammograms'].map((type) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span>{type}</span>
                    <span className="text-muted-foreground">-- MB</span>
                  </div>
                ))}
              </div>
              {/* API: Fetch storage breakdown */}
            </CardContent>
          </Card>
        </div>

        {/* System Health / Alerts */}
        <Card className="">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-300">System Status: Healthy</p>
                <p className="text-xs font-medium text-blue-200 opacity-60">All systems operational. Last backup: --</p>
              </div>
              <Button variant="outline" size="sm" className="bg-white">
                View Details
              </Button>
            </div>
          </CardContent>
          {/* API: Fetch system status */}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard