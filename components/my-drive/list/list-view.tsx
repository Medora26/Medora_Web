'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Eye,
  Image as ImageIcon 
} from 'lucide-react'
import Image from 'next/image'

// Types
interface ListViewRowProps {
  file: any
  onView: (fileId: string) => void
  onDownload: (url: string, filename: string) => void
  onShare: (fileId: string) => void
  onDelete: (fileId: string) => void
  formatDate: (timestamp: any) => string
  formatBytes: (bytes: number) => string
}

export function ListViewRow({
  file,
  onView,
  onDownload,
  onShare,
  onDelete,
  formatDate,
  formatBytes
}: ListViewRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-accent/50 transition-colors group">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(file.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}