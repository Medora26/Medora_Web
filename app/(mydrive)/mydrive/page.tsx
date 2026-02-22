'use client'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  MoreVertical,
  Star,
  Download,
  Share2,
  Trash2,
  Edit,
  Copy,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  X,
  ChevronDown,
  SlidersHorizontal,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/context/auth/authContext'
import { 
  getUserDocuments, 
  toggleDocumentStarred, 
  trashDocument 
} from '@/lib/firebase/service/uploadFile/service'
import { toast } from 'sonner'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { div } from 'three/src/nodes/math/OperatorNode.js'

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
    router.push(`/dashboard/view/${fileId}`)
  }

  // Handle download
  const handleDownload = (url: string, filename: string) => {
    window.open(url, '_blank')
  }

  // Handle share
  const handleShare = (fileId: string) => {
    router.push(`/dashboard/share/${fileId}`)
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
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
          <Button 
            variant={typeFilter === 'xray' ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTypeFilter('xray')}
          >
            X-Rays
          </Button>
          <Button 
            variant={typeFilter === 'mri' ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTypeFilter('mri')}
          >
            MRI
          </Button>
          <Button 
            variant={typeFilter === 'ct' ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTypeFilter('ct')}
          >
            CT
          </Button>
          <Button 
            variant={typeFilter === 'ultrasound' ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTypeFilter('ultrasound')}
          >
            Ultrasound
          </Button>
          <Button 
            variant={typeFilter === 'mammogram' ? 'secondary' : 'outline'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTypeFilter('mammogram')}
          >
            Mammograms
          </Button>
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

       {/* Grid View - Fix */}
{!loading && viewMode === 'grid' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {filteredFiles.map((file) => (
      <Card key={file.id} className="group overflow-hidden  hover:shadow-lg transition-all py-0 ">
        {/* Thumbnail Area */}
        <div className="aspect-square relative">
          {file.cloudinary?.thumbnailUrl || file.cloudinary?.url ? (
            <div className="relative w-full h-full ">
              <Image 
                fill
                src={file.cloudinary.thumbnailUrl || file.cloudinary.url}
                alt={file.documentName}
                
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            </div>
          )}
          
          {/* Study Type Badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full shadow-sm">
              {file.categoryLabel || file.category}
            </span>
          </div>
          
          {/* Star Indicator */}
          {file.isStarred && (
            <div className="absolute top-2 right-2 z-10">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          )}

          {/* Action Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewFile(file.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(file.cloudinary?.url, file.documentName)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare(file.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStarToggle(file.id, file.isStarred)}>
                  <Star className="h-4 w-4 mr-2" />
                  {file.isStarred ? 'Remove Star' : 'Add Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleMoveToTrash(file.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Move to Trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* File Info */}
        <CardContent className="pb-4 px-5">
          <div className="space-y-1">
            <h3 className="font-medium text-sm line-clamp-1" title={file.documentName}>
              {file.documentName || 'Untitled'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDate(file.uploadedAt)}</span>
              <span>•</span>
              <span>{formatBytes(file.cloudinary?.bytes || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)}

{/* List View - Fix */}
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
        <div key={file.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-accent/50 transition-colors group">
          <div className="col-span-5 flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
              {file.cloudinary?.thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <Image 
                   fill
                    src={file.cloudinary.thumbnailUrl}
                    alt={file.documentName}
                    
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.documentName || 'Untitled'}</p>
            </div>
            {file.isStarred && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          <div className="col-span-2">
            <span className="px-2 py-1 bg-muted rounded-full text-xs">
              {file.categoryLabel || file.category}
            </span>
          </div>
          <div className="col-span-2 text-muted-foreground">{formatDate(file.uploadedAt)}</div>
          <div className="col-span-2 text-muted-foreground">{formatBytes(file.cloudinary?.bytes || 0)}</div>
          <div className="col-span-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleViewFile(file.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(file.cloudinary?.url, file.documentName)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare(file.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleMoveToTrash(file.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  </Card>
)}

        {/* Empty State */}
        {!loading && filteredFiles.length === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {files.length === 0 ? 'No files yet' : 'No matching files'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {files.length === 0 
                  ? 'Upload your first medical image to start organizing your studies.'
                  : 'Try adjusting your search or filters to find what you\'re looking for.'}
              </p>
              {files.length === 0 ? (
                <Button onClick={() => router.push('/dashboard/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                    setStarredFilter(false)
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Page