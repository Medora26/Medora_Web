'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  Star, 
  Download, 
  Share2, 
  Trash2, 
  Edit, 
  Eye,
  Image as ImageIcon 
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { ShareModal } from '@/components/share/share-modal'

// Types
interface GridViewCardProps {
  file: any
  onView: (fileId: string) => void
  onDownload: (url: string, filename: string) => void
  onShare: (fileId: string) => void
  onStarToggle: (fileId: string, currentStarred: boolean) => void
  onRename?: (fileId: string) => void
  onDelete: (fileId: string) => void
  formatDate: (timestamp: any) => string
  formatBytes: (bytes: number) => string
}

export function GridViewCard({
  file,
  onView,
  onDownload,
  onShare,
  onStarToggle,
  onRename,
  onDelete,
  formatDate,
  formatBytes
}: GridViewCardProps) {
  const [shareDialog, setShareDialog] = useState(false);

  // Prepare file data for sharing
  const getFileShareData = () => {
    return {
      id: file.id,
      name: file.documentName || 'Untitled',
      settings: file.shareSettings || {
        shareId: file.shareId,
        accessLevel: file.accessLevel,
        requirePassword: file.requirePassword,
        hasPassword: !!file.sharePassword,
        expiresAt: file.shareExpiry,
        allowedEmails: file.sharedWith || [],
        viewCount: file.viewCount || 0,
        downloadCount: file.downloadCount || 0
      }
    }
  }

  const handleShareClick = () => {
   
    // Also call the parent onShare if needed for tracking
    onShare(file.id)
  }

  const handleShareClose = () => {
    setShareDialog(false)
  }

  const handleShareSuccess = () => {
    // You can refresh the file data here if needed
    // For example, you might want to update the local file state
    // with new share settings
    setShareDialog(false)
  }

  return (
   <>
    <Card key={file.id} className="group overflow-hidden hover:shadow-lg transition-all py-0">
      {/* Thumbnail Area */}
      <div className="aspect-square relative">
        {file.cloudinary?.thumbnailUrl || file.cloudinary?.url ? (
          <div className="relative w-full h-full">
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

        {/* Share Badge - Show if file is shared */}
        {file.isShared && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Shared
            </span>
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
              <DropdownMenuItem onClick={() => onView(file.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(file.cloudinary.url, file.cloudinary.format)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareDialog(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                {file.isShared ? 'Manage sharing' : 'Share'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStarToggle(file.id, file.isStarred)}>
                <Star className="h-4 w-4 mr-2" />
                {file.isStarred ? 'Remove Star' : 'Add Star'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onRename && (
                <DropdownMenuItem onClick={() => onRename(file.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
             
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(file.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

         <div className="absolute -bottom-14 right-4 z-20 md:hidden sm:hidden lg:hidden xs:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(file.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(file.cloudinary.url, file.cloudinary.format)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareDialog(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                {file.isShared ? 'Manage sharing' : 'Share'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStarToggle(file.id, file.isStarred)}>
                <Star className="h-4 w-4 mr-2" />
                {file.isStarred ? 'Remove Star' : 'Add Star'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onRename && (
                <DropdownMenuItem onClick={() => onRename(file.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
             
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(file.id)}
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
          
          {/* Share Stats - Show if file is shared */}
          {file.isShared && (file.viewCount > 0 || file.downloadCount > 0) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {file.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {file.viewCount} {file.viewCount === 1 ? 'view' : 'views'}
                </span>
              )}
              {file.downloadCount > 0 && (
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {file.downloadCount} {file.downloadCount === 1 ? 'download' : 'downloads'}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    <ShareModal
      isOpen={shareDialog}
      onClose={handleShareClose}
      fileId={getFileShareData().id}
      fileName={getFileShareData().name}
      currentShareSettings={getFileShareData().settings}
      onSuccess={handleShareSuccess}
    />
   </>
  )
}