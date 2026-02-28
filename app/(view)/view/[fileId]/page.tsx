'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import DashboardLayout from '@/components/layouts/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Download,
  Calendar,
  Star,
  FileText,
  Loader2,
  Lock,
  Globe
} from 'lucide-react'
import Image from 'next/image'
import { toggleDocumentStarred } from '@/lib/firebase/service/uploadFile/service'
import { downloadFile } from '@/lib/utils/downloadFile'

interface DocumentData {
  id: string
  documentName: string
  description?: string
  documentDate?: string
  uploadedAt: any
  category?: string
  categoryLabel?: string
  tags?: string[]
  isStarred?: boolean
  starredAt?: any
  fileInfo?: {
    size: number
    fileTypeCategory: string
  }
  shareSettings?: {
    accessLevel?: string
    isPublic?: boolean
    requirePassword?: boolean
    expiresAt?: any
  }
  cloudinary: {
    url: string
    format: string
  }
}

export default function ViewPage() {
  const { fileId } = useParams() as { fileId: string }

  const [document, setDocument] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDoc = async () => {
      const snap = await getDoc(doc(db, 'documents', fileId))
      if (snap.exists()) {
        setDocument({ id: snap.id, ...(snap.data() as any) })
      }
      setLoading(false)
    }

    fetchDoc()
  }, [fileId])

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '--'
    const date = timestamp.toDate?.() || new Date(timestamp)
    return date.toLocaleDateString()
  }

  const handleStarToggle = async () => {
    if (!document) return
    await toggleDocumentStarred(document.id, !document.isStarred)
    setDocument(prev =>
      prev ? { ...prev, isStarred: !prev.isStarred } : prev
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!document) return null

  const format = document.cloudinary.format?.toLowerCase()
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(format)
  const isPDF = format === 'pdf'

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{document.documentName}</h1>

              <button onClick={handleStarToggle}>
                <Star
                  className={`h-5 w-5 ${
                    document.isStarred
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3 mt-2 flex-wrap">
              {document.categoryLabel && (
                <Badge variant="secondary">
                  {document.categoryLabel}
                </Badge>
              )}

              <span className="text-sm text-muted-foreground">
                Uploaded {formatDate(document.uploadedAt)}
              </span>

              {document.fileInfo?.fileTypeCategory && (
                <Badge variant="outline">
                  {document.fileInfo.fileTypeCategory}
                </Badge>
              )}
            </div>
          </div>

          <Button
  onClick={() =>
    downloadFile(
      document.cloudinary.url,
      document.cloudinary.format
    )
  }
>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* PREVIEW */}
<Card>
  <CardContent className="p-6 flex justify-center">
    <div className="max-h-[500px] w-auto rounded-lg overflow-hidden border">
      {isImage && (
        <Image
          src={document.cloudinary.url}
          alt={document.documentName}
          width={800}
          height={600}
          className="object-contain h-auto w-auto max-h-[500px]"
        />
      )}

      {isPDF && (
        <iframe
          src={document.cloudinary.url}
          className="w-[800px] h-[500px]"
        />
      )}
    </div>
  </CardContent>
</Card>

        {/* METADATA */}
        <div className="grid md:grid-cols-2 gap-6">

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold">File Details</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Size: {formatBytes(document.fileInfo?.size || 0)}</div>
                <div>Format: {document.cloudinary.format?.toUpperCase()}</div>
                {document.documentDate && (
                  <div>Document Date: {document.documentDate}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold">Share Settings</h2>

              {document.shareSettings ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    Access Level: {document.shareSettings.accessLevel}
                  </div>

                  <div className="flex items-center gap-1">
                    {document.shareSettings.isPublic ? (
                      <>
                        <Globe className="h-4 w-4" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" /> Private
                      </>
                    )}
                  </div>

                  {document.shareSettings.requirePassword && (
                    <div>Password Protected</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Not shared
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* DESCRIPTION & TAGS */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="font-semibold">Description</h2>
            <p className="text-sm text-muted-foreground">
              {document.description || 'No description provided.'}
            </p>

            {document.tags && document.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2">
                {document.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}