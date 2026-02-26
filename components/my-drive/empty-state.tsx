'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Upload } from 'lucide-react'

interface EmptyStateProps {
  hasFiles: boolean
  onClearFilters: () => void
  onUpload: () => void
}

export function EmptyState({ hasFiles, onClearFilters, onUpload }: EmptyStateProps) {
  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {!hasFiles ? 'No files yet' : 'No matching files'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {!hasFiles 
            ? 'Upload your first medical image to start organizing your studies.'
            : 'Try adjusting your search or filters to find what you\'re looking for.'}
        </p>
        {!hasFiles ? (
          <Button onClick={onUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        ) : (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}