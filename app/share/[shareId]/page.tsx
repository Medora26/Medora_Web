'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Download, 
  Eye, 
  Lock, 
  Calendar,
  User,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth/authContext'
import { 
  getDocumentByShareId,
  verifySharePassword,
  trackShareView,
  trackShareDownload,
  ShareSettings,
  SharedUser
} from '@/lib/firebase/service/uploadFile/service'
import { Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { LOGO } from '@/public/logo/logo'
import Navbar from '@/components/navbar'
import { formatBytes } from '@/utils/utils'

// Define proper types
interface SharedDocument {
  id: string
  documentName: string
  description?: string
  userEmail?: string
  uploadedAt: Timestamp
  cloudinary: {
    url: string
    thumbnailUrl?: string
    format: string
    bytes: number
    publicId: string
  }
  shareSettings: ShareSettings
  category?: string
  categoryLabel?: string
}

interface ErrorResponse {
  error: string
  code: string
}

type DocumentResponse = SharedDocument | ErrorResponse | null

// Helper function to check if response is error
const isErrorResponse = (response: any): response is ErrorResponse => {
  return response && 'error' in response
}

// Helper function to check if response is document
const isSharedDocument = (response: any): response is SharedDocument => {
  return response && 'id' in response && 'shareSettings' in response
}

export default function SharedDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // Safely extract shareId from params
  const shareId = Array.isArray(params.shareId) ? params.shareId[0] : params.shareId
  
  const [document, setDocument] = useState<SharedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [verifyingPassword, setVerifyingPassword] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(false)
const fetchSharedDocument = async (skipPasswordCheck = false) => {
  console.log('🔍 [PAGE] ===== START fetchSharedDocument =====');
  console.log('🔍 [PAGE] Fetching document for shareId:', shareId);
  
  if (!shareId) {
    setError('Invalid share link');
    setLoading(false);
    return;
  }
  
  try {
    setLoading(true)
    console.log('🔍 [PAGE] Calling getDocumentByShareId...');
    
    const result = await getDocumentByShareId(shareId) as DocumentResponse
    
    console.log('🔍 [PAGE] getDocumentByShareId returned:', result);
    
    if (!result) {
      console.log('❌ [PAGE] Result is null - document not found');
      setError('Document not found or has been removed')
      return
    }

    if (isErrorResponse(result)) {
      console.log('❌ [PAGE] Result is error response:', result);
      setError(result.error)
      return
    }

    if (isSharedDocument(result)) {
      console.log('✅ [PAGE] Result is valid SharedDocument');
      setDocument(result)

      // Check if document requires password - but skip if we're already past password screen
      if (!skipPasswordCheck && result.shareSettings?.requirePassword && result.shareSettings?.password) {
        console.log('🔒 [PAGE] Document requires password');
        setRequiresPassword(true)
        setLoading(false)
        return
      }

      // Check access for restricted documents
      if (result.shareSettings?.accessLevel === 'restricted') {
        console.log('🔒 [PAGE] Document is restricted');
        await checkUserAccess(result)
      } else {
        console.log('🌐 [PAGE] Document is public, tracking view...');
        await trackShareView(shareId)
      }
    } else {
      console.log('❌ [PAGE] Result is neither error nor SharedDocument:', result);
      setError('Invalid document data')
    }

  } catch (error) {
    console.error('❌ [PAGE] Error in fetchSharedDocument:');
    console.error('❌ [PAGE] Full error:', error);
    setError('Failed to load document')
  } finally {
    setLoading(false)
    console.log('🔍 [PAGE] ===== END fetchSharedDocument =====');
  }
}
  useEffect(() => {
    console.log('🔍 [PAGE] ===== PAGE MOUNTED =====');
    console.log('🔍 [PAGE] shareId from params:', shareId);
    console.log('🔍 [PAGE] shareId type:', typeof shareId);
    console.log('🔍 [PAGE] User auth state:', user ? 'Logged in' : 'Not logged in');
    
    if (!shareId) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }
    
    if (user) {
      console.log('🔍 [PAGE] User email:', user.email);
      console.log('🔍 [PAGE] User UID:', user.uid);
    }
    
    fetchSharedDocument()
  }, [shareId, user])


  const checkUserAccess = async (doc: SharedDocument) => {
    console.log('🔍 [ACCESS] ===== START checkUserAccess =====');
    console.log('🔍 [ACCESS] Current user:', user?.email);
    console.log('🔍 [ACCESS] Document sharedWith:', doc.shareSettings?.sharedWith);
    
    if (!user) {
      console.log('🔍 [ACCESS] User not logged in, redirecting to signup');
      if (shareId) {
        router.push(`/signup?redirect=/share/${shareId}`)
      } else {
        router.push('/signup')
      }
      return
    }

    setCheckingAccess(true)
    
    // Check if user's email is in sharedWith list
    const hasAccess = doc.shareSettings?.sharedWith?.some(
      (shared: SharedUser) => shared.email === user.email
    )

    console.log('🔍 [ACCESS] Has access?', hasAccess);

    if (!hasAccess) {
      console.log('🔍 [ACCESS] Access denied for user:', user.email);
      setAccessDenied(true)
      setCheckingAccess(false)
      return
    }

    console.log('✅ [ACCESS] Access granted for user:', user.email);
    
    // Track view
    if (shareId) {
      await trackShareView(shareId)
    }
    setCheckingAccess(false)
    console.log('🔍 [ACCESS] ===== END checkUserAccess =====');
  }

 const handlePasswordSubmit = async () => {
  console.log('🔍 [PASSWORD] Submitting password...');
  
  if (!shareId) {
    toast.error('Invalid share link');
    return;
  }
  
  setVerifyingPassword(true);
  
  try {
    console.log('🔍 [PASSWORD] Using shareId:', shareId);
    
    const isValid = await verifySharePassword(shareId, password);
    console.log('🔍 [PASSWORD] Password valid?', isValid);
    
    if (isValid) {
      console.log('✅ [PASSWORD] Password correct, fetching document...');
      
      // Set requiresPassword to false immediately
      setRequiresPassword(false);
      
      // Clear password
      setPassword('');
      
      // Fetch the document again with the new state
      const result = await getDocumentByShareId(shareId) as DocumentResponse;
      
      if (result && !isErrorResponse(result) && isSharedDocument(result)) {
        console.log('✅ [PASSWORD] Document fetched after password verification');
        setDocument(result);
        toast.success('Access granted');
      } else {
        console.error('❌ [PASSWORD] Failed to fetch document after verification');
        toast.error('Failed to load document');
      }
    } else {
      console.log('❌ [PASSWORD] Invalid password');
      toast.error('Invalid password');
      setPassword(''); // Clear password field
    }
  } catch (error: any) {
    console.error('❌ [PASSWORD] Error:', error);
    
    if (error.message === 'Authentication required to verify password') {
      toast.error('Please sign in to access this document');
      router.push(`/signup?redirect=/share/${shareId}`);
    } else {
      toast.error('Failed to verify password');
    }
  } finally {
    setVerifyingPassword(false);
  }
};
  
  const handleDownload = async () => {
    if (!document) return
    
    try {
      console.log('🔍 [DOWNLOAD] Downloading document:', document.documentName);
      window.open(document.cloudinary.url, '_blank')
      if (shareId) {
        await trackShareDownload(shareId)
      }
      toast.success('Download started')
    } catch (error) {
      console.error('❌ [DOWNLOAD] Error:', error);
      toast.error('Failed to download')
    }
  }

  if (!shareId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
            <p className="text-muted-foreground mb-6">The share link is invalid or malformed.</p>
            <Button onClick={() => router.push('/')}>Go to Medora</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Document Unavailable</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/')}>Go to Medora</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-2">
              This document is restricted to specific users.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Your email ({user?.email}) doesn't have access permissions.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to My Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-2xl font-bold mb-2">Password Protected</h1>
              <p className="text-muted-foreground">
                This document requires a password to view
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              
              <Button 
                className="w-full"
                onClick={handlePasswordSubmit}
                disabled={verifyingPassword || !password}
              >
                {verifyingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Access Document'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!document) return null

  return (
  <div className="min-h-screen">
  {/* Header */}
  <header className="sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <Link href="/" className="flex items-center">
          <Image
            src={LOGO.MEDORA_LOGO}
            alt="Medora"
            width={90}
            height={10}
            className="w-20 object-contain"
            priority
          />
        </Link>

        {!user ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/sign-in')} size="sm">
              Sign in
            </Button>
            <Button onClick={() => router.push('/sign-up')} size="sm">
              Sign up
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => router.push('/dashboard')} size="sm">
            Dashboard
          </Button>
        )}
      </div>
    </div>
  </header>

  {/* Main Content */}
  <main className="max-w-4xl mx-auto px-4 py-16">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-medium">{document.documentName}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{document.shareSettings?.viewCount || 0} views</span>
          <span>•</span>
          <span>{formatDate(document.uploadedAt)}</span>
        </div>
      </div>

      {/* Image Card */}
      <div className="relative group">
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden border">
          <Image
            src={document.cloudinary.url}
            alt={document.documentName}
            fill
            className="object-contain"
            priority
          />
          
          {/* Download button - only show if allowed */}
          {(document.shareSettings?.accessLevel === 'download' || document.shareSettings?.accessLevel === 'edit') && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDownload}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Subtle metadata */}
        <div className="absolute bottom-3 left-3 flex gap-2 text-xs text-muted-foreground">
          <span>{document.cloudinary.format?.toUpperCase()}</span>
          <span>•</span>
          <span>{formatBytes(document.cloudinary.bytes)}</span>
        </div>
      </div>

      {/* Shared by line */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium">
            {document.userEmail?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <span>
          <span className="text-foreground">{document.userEmail || 'Medora user'}</span> shared this file
        </span>
      </div>

      {/* Sign up prompt - minimal */}
      {!user && (
        <div className="text-sm text-muted-foreground">
          <Button variant="link" onClick={() => router.push('/signup')} className="px-0 h-auto">
            Sign up
          </Button>
          <span> to save to your account</span>
        </div>
      )}

      {/* Restricted access message - minimal */}
      {document.shareSettings?.accessLevel === 'restricted' && user && (
        <div className="text-sm text-muted-foreground">
          <Lock className="h-3 w-3 inline mr-1" />
          Shared privately with you
        </div>
      )}
    </div>
  </main>
</div>
  )
}

// Helper function to format date
const formatDate = (timestamp: Timestamp) => {
  if (!timestamp) return '--'
  try {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch {
    return '--'
  }
}