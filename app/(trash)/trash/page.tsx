'use client'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import { 
  Trash2, 
  RefreshCw, 
  Search, 
  MoreVertical,
  Download,
  Eye,
  RotateCcw,
  XCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  Grid,
  List,
  Brain,
  Heart,
  Scan,
  Microscope
} from 'lucide-react'
import { useAuth } from '@/context/auth/authContext'
import React, { useEffect, useState } from 'react'
import {getTrashedDocuments,permanentlyDeleteDocument,restoreDocument} from "@/lib/firebase/service/uploadFile/service"
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return '--';
  }
};

// Type-specific icons mapping (kept as fallback)
const getTypeIcon = (type: string) => {
  switch(type) {
    case 'X-Ray':
      return <Scan className="h-5 w-5 text-blue-500" />
    case 'MRI':
      return <Brain className="h-5 w-5 text-purple-500" />
    case 'CT':
      return <Scan className="h-5 w-5 text-orange-500" />
    case 'Ultrasound':
      return <Heart className="h-5 w-5 text-pink-500" />
    case 'Mammogram':
      return <Microscope className="h-5 w-5 text-rose-500" />
    default:
      return <ImageIcon className="h-5 w-5 text-gray-500" />
  }
};

const page = () => {
   const {user} = useAuth()
   const [loading, setLoading] = useState(false)
   const [trashData, setTrashData] = useState<any[]>([])
   const [filteredData, setFilteredData] = useState<any[]>([])
   const [searchTerm, setSearchTerm] = useState('')
   const [typeFilter, setTypeFilter] = useState('all')
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
   const [selectedItems, setSelectedItems] = useState<string[]>([])
   const [deleteDialog, setDeleteDialog] = useState(false)
   const router = useRouter()
  //get trash doc 
  useEffect(() => {
     const fetchTrash = async () => {   
         if(!user?.uid) return 

         try {
           setLoading(true)
           const trashData = await getTrashedDocuments(user.uid)
           setTrashData(trashData)
           setFilteredData(trashData)
         } catch (error) {
            console.log(`Error fetching trash data: ${error}`)
            toast.error(`Error Fetching trash data`)
         } finally {
            setLoading(false)
         }
     }
      fetchTrash()
  },[user])


  // Handle search and filter
  useEffect(() => {
    let filtered = [...trashData]

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryLabel?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.category?.toLowerCase() === typeFilter.toLowerCase()
      )
    }

    setFilteredData(filtered)
  }, [searchTerm, typeFilter, trashData])

  //handle restore 
  const handleRestore = async (documentId: string) => {
     try {
       await restoreDocument(documentId)
       setTrashData(prev => prev.filter(item => item.id !== documentId))
       setSelectedItems(prev => prev.filter(id => id !== documentId))
       toast.success(`Document Restore Successfully!`)
     } catch (error) {
        console.error(`Document not restored successfully`)
        toast.error(`Document not restored successfully!`)
     }
  }

  const handlePermanentDelete = async (documentId: string) => {
      if (!confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
      return
    }

    try {
      await permanentlyDeleteDocument(documentId)
      setTrashData(prev => prev.filter(item => item.id !== documentId))
      setSelectedItems(prev => prev.filter(id => id !== documentId))
      toast.success('Document Delete Permanently')
    } catch (error) {
      console.log("Failed to delete permanently", error)
      toast.error("failed to delete permanently")
    }
  }
   // Handle bulk restore
  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return
    
    try {
      await Promise.all(selectedItems.map(id => restoreDocument(id)))
      setTrashData(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      toast.success(`${selectedItems.length} documents restored`)
    } catch (error) {
      console.error('Error bulk restoring:', error)
      toast.error('Failed to restore some documents')
    }
  }
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`Are you sure you want to permanently delete ${selectedItems.length} documents? This action cannot be undone.`)) {
      return
    }

    try {
      await Promise.all(selectedItems.map(id => permanentlyDeleteDocument(id)))
      setTrashData(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      toast.success(`${selectedItems.length} documents permanently deleted`)
    } catch (error) {
      console.error('Error bulk deleting:', error)
      toast.error('Failed to delete some documents')
    }
  }


  // Toggle item selection
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredData.map(item => item.id))
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
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6  ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
            <p className="text-muted-foreground">
              {trashData.length} {trashData.length === 1 ? 'item' : 'items'} in trash
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkRestore}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore ({selectedItems.length})
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleBulkDelete}
                  className='dark:bg-red-500 dark:text-white bg-red-500'
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedItems.length})
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        {trashData.length > 0 && (
          <Card className=" border">
            <CardContent className=" flex items-center gap-2">
              <AlertCircle className="h-4 w-4 " />
              <p className="font-semibold">
                Items in trash are automatically deleted after 30 days
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search deleted files..." 
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!loading && trashData.length === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Items moved to trash will appear here and are automatically deleted after 30 days.
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Results State */}
        {!loading && trashData.length > 0 && filteredData.length === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matching items</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search or filter
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredData.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-all relative py-0">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-20">
                  <input 
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>

                {/* Image Thumbnail */}
                <div className="aspect-square bg-muted relative overflow-hidden rounded-t-lg">
                  {item.cloudinary?.thumbnailUrl || item.cloudinary?.url ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={item.cloudinary.thumbnailUrl || item.cloudinary.url}
                        alt={item.documentName || 'Document thumbnail'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        {getTypeIcon(item.category)}
                        <span className="text-xs text-muted-foreground">No preview</span>
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="pb-4 px-4 pt-0">
                  <div className="flex items-start gap-3">
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1" title={item.documentName}>
                        {item.documentName || 'Untitled'}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground  mt-1">
                       {/*  <span className=" px-1.5 py-0.5 rounded text-[10px]">
                          {item.categoryLabel || item.category}
                        </span> */}
                        
                        <span>{formatBytes(item.cloudinary?.bytes || 0)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Deleted {formatDate(item.trashedAt)}
                      </p>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewFile(item.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(item.cloudinary?.url, item.documentName)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handlePermanentDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && filteredData.length > 0 && (
          <Card>
            <div className="divide-y">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/50">
                <div className="col-span-1">
                  <input 
                    type="checkbox"
                    checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Deleted</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredData.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-accent/50 transition-colors group">
                  <div className="col-span-1">
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.cloudinary?.thumbnailUrl ? (
                        <div className="relative w-full h-full">
                          <Image 
                            src={item.cloudinary.thumbnailUrl}
                            alt={item.documentName}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        getTypeIcon(item.category)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.documentName || 'Untitled'}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-1 bg-muted rounded-full text-xs">
                      {item.categoryLabel || item.category}
                    </span>
                  </div>
                  <div className="col-span-2 text-muted-foreground">{formatDate(item.trashedAt)}</div>
                  <div className="col-span-2 text-muted-foreground">{formatBytes(item.cloudinary?.bytes || 0)}</div>
                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleViewFile(item.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(item.cloudinary?.url, item.documentName)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handlePermanentDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default page