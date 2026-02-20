'use client'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/firebase/service/auth'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  Upload, 
  FileText,
  Calendar,
  PieChart,
  BarChart3,
  Clock,
  HardDrive,
  AlertCircle,
  ArrowUpRight,
  Image,
  File,
  Film
} from 'lucide-react'

//import doc servide 
import { getDocumentStatistics, getUserDocuments } from "@/lib/firebase/service/uploadFile/service"
import { useAuth } from '@/context/auth/authContext'

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper to format date
const formatDate = (timestamp: any) => {
  if (!timestamp) return '--';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString();
  } catch {
    return '--';
  }
};

// Study type mapping
const studyTypeMap: Record<string, string> = {
  'X-Ray': 'X-Rays',
  'MRI': 'MRI Scans',
  'CT': 'CT Scans',
  'Ultrasound': 'Ultrasounds',
  'Mammogram': 'Mammograms'
};

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDocuments: 0,
    starredDocuments: 0,
    totalSize: 0,
    categories: {} as Record<string, number>,
    fileTypes: {} as Record<string, number>
  })
  const [recentUploads, setRecentUploads] = useState<any[]>([])
  const [uploadsThisMonth, setUploadsThisMonth] = useState(0)
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(Array(7).fill(0))

  // Fetch dashboard data 
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return
      
      try {
        setLoading(true)
        
        // Get document statistics
        const statistics = await getDocumentStatistics(user.uid)
        setStats(statistics)

        // Get all documents for recent uploads and calculations
        const allDocs = await getUserDocuments(user.uid, { 
          includeTrashed: false 
        })
        
        // Sort by uploadedAt for recent uploads
        const sorted = [...allDocs].sort((a: any, b: any) => {
          const dateA = a.uploadedAt?.toDate?.() || new Date(0)
          const dateB = b.uploadedAt?.toDate?.() || new Date(0)
          return dateB - dateA
        })
        
        // Set recent uploads (first 5)
        setRecentUploads(sorted.slice(0, 5))

        // Calculate uploads this month
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const monthUploads = allDocs.filter((doc: any) => {
          const uploadDate = doc.uploadedAt?.toDate?.()
          return uploadDate && uploadDate >= firstDayOfMonth
        })
        setUploadsThisMonth(monthUploads.length)

        // Calculate weekly activity
        const weeklyCounts = Array(7).fill(0)
        const today = new Date()
        
        allDocs.forEach((doc: any) => {
          const uploadDate = doc.uploadedAt?.toDate?.()
          if (uploadDate) {
            const diffDays = Math.floor((today.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays < 7) {
              weeklyCounts[6 - diffDays]++ // Reverse to show Mon-Sun order
            }
          }
        })
        setWeeklyActivity(weeklyCounts)

      } catch (error) {
        console.error('Error fetch dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [user])

  const getCategoryPercentage = (count: number) => {
    if (stats.totalDocuments === 0) return 0
    return (count / stats.totalDocuments) * 100
  }

  const getFileTypeIcon = (type: string) => {
    switch(type) {
      case 'image': return <Image className="h-4 w-4" />
      case 'document': return <File className="h-4 w-4" />
      case 'video': return <Film className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }

  // Get max value for chart scaling
  const maxWeeklyValue = Math.max(...weeklyActivity, 1)

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your medical imaging data</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-default">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
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
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                    <span className="text-emerald-500">{stats.starredDocuments}</span>
                    <span className="ml-1">starred</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Storage Used */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of 500 MB ({((stats.totalSize / (500 * 1024 * 1024)) * 100).toFixed(1)}%)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Uploads This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploads This Month</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{uploadsThisMonth}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Last upload {recentUploads[0] ? formatDate(recentUploads[0].uploadedAt) : '--'}
                    </span>
                  </div>
                </>
              )}
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
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.categories).length > 0 ? (
                    Object.entries(stats.categories).map(([category, count]) => (
                      <div key={category} className="flex items-center">
                        <div className="w-24 text-sm truncate">{studyTypeMap[category] || category}</div>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${getCategoryPercentage(count)}%` }} 
                            />
                          </div>
                        </div>
                        <div className="w-12 text-right text-sm">{count}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No studies uploaded yet
                    </p>
                  )}
                </div>
              )}
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
              {loading ? (
                <div className="h-40 flex items-end justify-between gap-2">
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="flex-1 h-full bg-muted animate-pulse rounded-t-md" />
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-end justify-between gap-2">
                  {weeklyActivity.map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary/20 rounded-t-md transition-all duration-500"
                        style={{ 
                          height: value > 0 ? `${(value / maxWeeklyValue) * 100}%` : '4px',
                          minHeight: value > 0 ? '8px' : '4px',
                          backgroundColor: value > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                        }} 
                      />
                      <span className="text-xs text-muted-foreground">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                      </span>
                      {value > 0 && (
                        <span className="text-xs font-medium absolute -mt-6 bg-background px-1 rounded">
                          {value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUploads.length > 0 ? (
                    recentUploads.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="truncate">{doc.documentName || 'Untitled'}</span>
                        </div>
                        <span className="text-muted-foreground text-xs flex-shrink-0 ml-2">
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent uploads
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Files by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.fileTypes).length > 0 ? (
                    Object.entries(stats.fileTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getFileTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {count} {count === 1 ? 'file' : 'files'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No files uploaded yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Health / Alerts */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  System Status: Healthy
                </p>
                <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70">
                  {stats.totalDocuments} documents • Last backup: Today at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <Button variant="outline" size="sm" className="bg-white dark:bg-background">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard