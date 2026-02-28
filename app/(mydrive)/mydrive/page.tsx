'use client'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Grid, 
  List, 
  Search, 
  Upload,
  Star,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/context/auth/authContext'
import { 
  getUserDocuments, 
  toggleDocumentStarred, 
  trashDocument 
} from '@/lib/firebase/service/uploadFile/service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Import components
import { GridViewCard } from '@/components/my-drive/grid/my-drive-grid'
import { ListViewRow } from '@/components/my-drive/list/list-view'
import { EmptyState } from '@/components/my-drive/empty-state'
import { downloadFile } from '@/lib/utils/downloadFile'

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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return '--';
  }
};

const Page = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [files, setFiles] = useState<any[]>([])
  const [filteredFiles, setFilteredFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [starredFilter, setStarredFilter] = useState(false)

  // Fetch files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!user?.uid) return
      
      try {
        setLoading(true)
        const documents = await getUserDocuments(user.uid, { 
          includeTrashed: false 
        })
        
        // Sort by uploadedAt descending
        const sorted = [...documents].sort((a: any, b: any) => {
          const dateA = a.uploadedAt?.toDate?.() || new Date(0)
          const dateB = b.uploadedAt?.toDate?.() || new Date(0)
          return dateB - dateA
        })
        
        setFiles(sorted)
        setFilteredFiles(sorted)
      } catch (error) {
        console.error('Error fetching files:', error)
        toast.error('Failed to load files')
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [user])

  // Handle search and filters
  useEffect(() => {
    let filtered = [...files]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.categoryLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => 
        file.category?.toLowerCase() === typeFilter.toLowerCase()
      )
    }

    // Apply starred filter
    if (starredFilter) {
      filtered = filtered.filter(file => file.isStarred)
    }

    setFilteredFiles(filtered)
  }, [searchTerm, typeFilter, starredFilter, files])

  // Handle star toggle
  const handleStarToggle = async (fileId: string, currentStarred: boolean) => {
    try {
      await toggleDocumentStarred(fileId, !currentStarred)
      
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, isStarred: !currentStarred }
          : file
      ))
      
      toast.success(currentStarred ? 'Removed from starred' : 'Added to starred')
    } catch (error) {
      console.error('Error toggling star:', error)
      toast.error('Failed to update star')
    }
  }

  // Handle move to trash
  const handleMoveToTrash = async (fileId: string) => {
    try {
      await trashDocument(fileId)
      setFiles(prev => prev.filter(file => file.id !== fileId))
      toast.success('Moved to trash')
    } catch (error) {
      console.error('Error moving to trash:', error)
      toast.error('Failed to move to trash')
    }
  }

  // Handle view file
const handleViewFile = (fileId: string) => {
  router.push(`/view/${fileId}`);
};
  // Handle download
const handleDownload = (url: string, format: string) => {
  downloadFile(url, format)
}
  // Handle share
  const handleShare = (fileId: string) => {
    router.push(`/dashboard/share/${fileId}`)
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setStarredFilter(false)
  }

  // Quick filter types
  const quickFilters = [
    { value: 'xray', label: 'X-Rays' },
    { value: 'mri', label: 'MRI' },
    { value: 'ct', label: 'CT' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'mammogram', label: 'Mammograms' },
  ]

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Drive</h1>
            <p className="text-muted-foreground">Manage and organize your medical images</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search files, patients, or study types..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="xray">X-Rays</SelectItem>
                <SelectItem value="mri">MRI Scans</SelectItem>
                <SelectItem value="ct">CT Scans</SelectItem>
                <SelectItem value="ultrasound">Ultrasounds</SelectItem>
                <SelectItem value="mammogram">Mammograms</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setStarredFilter(!starredFilter)}
              className={starredFilter ? 'bg-accent' : ''}
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-accent' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button 
            variant={typeFilter === 'all' ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          {quickFilters.map((filter) => (
            <Button 
              key={filter.value}
              variant={typeFilter === filter.value ? 'secondary' : 'outline'} 
              size="sm" 
              className="rounded-full"
              onClick={() => setTypeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
          <Button 
            variant={starredFilter ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setStarredFilter(!starredFilter)}
          >
            <Star className="h-3 w-3 mr-1" />
            Starred
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <GridViewCard
                key={file.id}
                file={file}
                onView={handleViewFile}
                onDownload={handleDownload}
                onShare={handleShare}
                onStarToggle={handleStarToggle}
                onDelete={handleMoveToTrash}
                formatDate={formatDate}
                formatBytes={formatBytes}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && (
          <Card>
            <div className="divide-y">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/50">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredFiles.map((file) => (
                <ListViewRow
                  key={file.id}
                  file={file}
                  onView={handleViewFile}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  onDelete={handleMoveToTrash}
                  formatDate={formatDate}
                  formatBytes={formatBytes}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredFiles.length === 0 && (
          <EmptyState
            hasFiles={files.length > 0}
            onClearFilters={handleClearFilters}
            onUpload={() => router.push('/dashboard/upload')}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default Page