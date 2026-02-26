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
  return (
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
              <DropdownMenuItem onClick={() => onDownload(file.cloudinary?.url, file.documentName)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(file.id)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
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
              <DropdownMenuSeparator />
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
        </div>
      </CardContent>
    </Card>
  )
}