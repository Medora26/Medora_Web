'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Copy,
  Link2,
  Plus,
  X,
  Globe,
  Lock,
  Users,
  Download,
  Eye,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth/authContext'
import { 
  createShareLink, 
  updateShareSettings,
  disableSharing,
  addSharedUser,
  removeSharedUser,
  ShareSettings,
  SharedUser
} from '@/lib/firebase/service/uploadFile/service'
import { Timestamp } from 'firebase/firestore'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
  currentShareSettings?: ShareSettings
  onSuccess?: () => void
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  fileId, 
  fileName,
  currentShareSettings,
  onSuccess
}: ShareModalProps) {
  const { user } = useAuth()
  
  // Local state for share settings
  const [shareLink, setShareLink] = useState('')
  const [shareId, setShareId] = useState<string | undefined>(currentShareSettings?.shareId)
  const [accessType, setAccessType] = useState<'anyone' | 'restricted'>(
    currentShareSettings?.accessLevel === 'restricted' ? 'restricted' : 'anyone'
  )
  const [linkAccess, setLinkAccess] = useState<'view' | 'download' | 'edit'>(
    currentShareSettings?.accessLevel === 'restricted' ? 'view' : 
    currentShareSettings?.accessLevel || 'view'
  )
  const [requirePassword, setRequirePassword] = useState(
    currentShareSettings?.requirePassword || false
  )
  const [password, setPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [expiryEnabled, setExpiryEnabled] = useState(!!currentShareSettings?.expiresAt)
  const [expiryDate, setExpiryDate] = useState(
    currentShareSettings?.expiresAt 
      ? new Date(currentShareSettings.expiresAt.seconds * 1000).toISOString().slice(0, 16)
      : ''
  )
  const [newEmail, setNewEmail] = useState('')
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>(
    currentShareSettings?.sharedWith || []
  )
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('link')
  const [isShared, setIsShared] = useState(!!currentShareSettings?.shareId)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen && fileId) {
      if (currentShareSettings?.shareableLink) {
        setShareLink(currentShareSettings.shareableLink)
        setShareId(currentShareSettings.shareId)
        setIsShared(true)
        setAccessType(currentShareSettings.accessLevel === 'restricted' ? 'restricted' : 'anyone')
        setLinkAccess(currentShareSettings.accessLevel === 'restricted' ? 'view' : currentShareSettings.accessLevel)
        setRequirePassword(currentShareSettings.requirePassword || false)
        setExpiryEnabled(!!currentShareSettings.expiresAt)
        if (currentShareSettings.expiresAt) {
          setExpiryDate(new Date(currentShareSettings.expiresAt.seconds * 1000).toISOString().slice(0, 16))
        }
        setSharedUsers(currentShareSettings.sharedWith || [])
      } else {
        // Reset to default state
        setShareLink('')
        setShareId(undefined)
        setIsShared(false)
        setAccessType('anyone')
        setLinkAccess('view')
        setRequirePassword(false)
        setPassword('')
        setShowPasswordField(false)
        setExpiryEnabled(false)
        setExpiryDate('')
        setSharedUsers([])
      }
      setHasUnsavedChanges(false)
    }
  }, [isOpen, fileId, currentShareSettings])

  // Track changes
  useEffect(() => {
    if (isShared && shareId) {
      const hasChanges = 
        accessType !== (currentShareSettings?.accessLevel === 'restricted' ? 'restricted' : 'anyone') ||
        linkAccess !== (currentShareSettings?.accessLevel === 'restricted' ? 'view' : currentShareSettings?.accessLevel) ||
        requirePassword !== (currentShareSettings?.requirePassword || false) ||
        (expiryEnabled && expiryDate !== (currentShareSettings?.expiresAt ? new Date(currentShareSettings.expiresAt.seconds * 1000).toISOString().slice(0, 16) : '')) ||
        JSON.stringify(sharedUsers) !== JSON.stringify(currentShareSettings?.sharedWith || [])
      
      setHasUnsavedChanges(hasChanges)
    }
  }, [accessType, linkAccess, requirePassword, expiryEnabled, expiryDate, sharedUsers, isShared, shareId, currentShareSettings])

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  // Handle add email
  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    if (sharedUsers.some(u => u.email === newEmail)) {
      toast.error('User already added')
      return
    }

    const newUser: SharedUser = {
      email: newEmail,
      accessLevel: linkAccess,
      sharedAt: Timestamp.now()
    }

    setSharedUsers([...sharedUsers, newUser])
    setNewEmail('')
    toast.success(`Added ${newEmail}`)
  }

  // Handle remove email
  const handleRemoveEmail = (email: string) => {
    setSharedUsers(sharedUsers.filter(u => u.email !== email))
    toast.success(`Removed ${email}`)
  }

  // Handle create new link
  const handleCreateLink = async () => {
    setIsSaving(true)
    try {
      const link = await createShareLink(fileId, {
        accessLevel: accessType === 'restricted' ? 'restricted' : linkAccess,
        expiresAt: expiryEnabled && expiryDate ? new Date(expiryDate) : null,
        requirePassword,
        password: requirePassword ? password : undefined,
        sharedWith: sharedUsers.map(u => ({
          email: u.email,
          accessLevel: u.accessLevel
        }))
      })
      
      // Extract shareId from the link
      const match = link.match(/\/share\/([^\/]+)$/)
      if (match && match[1]) {
        setShareId(match[1])
      }
      
      setShareLink(link)
      setIsShared(true)
      setHasUnsavedChanges(false)
      
      if (onSuccess) {
        onSuccess()
      }
      
      toast.success('Share link created successfully!')
      
    } catch (error) {
      console.error('Error creating share link:', error)
      toast.error('Failed to create share link')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle update settings
  const handleUpdateSettings = async () => {
    if (!shareId) return
    
    setIsUpdating(true)
    try {
      await updateShareSettings(fileId, {
        accessLevel: accessType === 'restricted' ? 'restricted' : linkAccess,
        requirePassword,
        password: requirePassword ? password : null,
        expiresAt: expiryEnabled && expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        sharedWith: sharedUsers,
        updatedAt: Timestamp.now()
      })
      
      setHasUnsavedChanges(false)
      
      if (onSuccess) {
        onSuccess()
      }
      
      toast.success('Share settings updated')
      
    } catch (error) {
      console.error('Error updating share settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle disable sharing
  const handleDisableSharing = async () => {
    setIsSaving(true)
    try {
      await disableSharing(fileId)
      
      // Reset local state
      setIsShared(false)
      setShareId(undefined)
      setShareLink('')
      setSharedUsers([])
      setHasUnsavedChanges(false)
      
      if (onSuccess) {
        onSuccess()
      }
      
      toast.success('Sharing disabled')
      
    } catch (error) {
      console.error('Error disabling sharing:', error)
      toast.error('Failed to disable sharing')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Share "{fileName}"</DialogTitle>
          <DialogDescription>
            Create a shareable link to this medical image
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="link">Link sharing</TabsTrigger>
              <TabsTrigger value="people">People with access</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="link" className="p-6 pt-4 space-y-6">
            {/* Link Type Selection */}
            <div className="space-y-3">
              <Label>General access</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {accessType === 'anyone' ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <Select 
                  value={accessType} 
                  onValueChange={(v: 'anyone' | 'restricted') => setAccessType(v)}
                >
                  <SelectTrigger className="w-[180px] border-0 p-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyone">Anyone with the link</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground flex-1">
                  {accessType === 'anyone' 
                    ? 'Anyone on the internet can access'
                    : 'Only specific people can access'
                  }
                </span>
              </div>
            </div>

            {/* Link Access Level (shown only for anyone) */}
            {accessType === 'anyone' && (
              <div className="space-y-3">
                <Label>Access level</Label>
                <Select 
                  value={linkAccess} 
                  onValueChange={(v: any) => setLinkAccess(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="download">Can view and download</SelectItem>
                    <SelectItem value="edit">Can view, download and edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Share Link Display */}
            {isShared && shareLink ? (
              <div className="space-y-3">
                <Label>Share link</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{shareLink}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with anyone. They'll be redirected to Medora to view the image.
                </p>
              </div>
            ) : null}

            {/* Additional Settings */}
            <div className="space-y-4 pt-2">
              {/* Password Protection */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Require password</Label>
                  <p className="text-xs text-muted-foreground">
                    Users must enter a password to access
                  </p>
                </div>
                <Switch 
                  checked={requirePassword}
                  onCheckedChange={(checked) => {
                    setRequirePassword(checked)
                    setShowPasswordField(checked)
                  }}
                />
              </div>
              
              {showPasswordField && requirePassword && (
                <div className="pl-6">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {/* Expiry Date */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Set expiration date</Label>
                  <p className="text-xs text-muted-foreground">
                    Link will automatically expire
                  </p>
                </div>
                <Switch 
                  checked={expiryEnabled}
                  onCheckedChange={setExpiryEnabled}
                />
              </div>

              {expiryEnabled && (
                <div className="pl-6">
                  <Input
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            {/* Stats (if available) */}
            {(currentShareSettings?.viewCount || currentShareSettings?.downloadCount) && (
              <div className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                {currentShareSettings?.viewCount !== undefined && currentShareSettings.viewCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{currentShareSettings.viewCount} {currentShareSettings.viewCount === 1 ? 'view' : 'views'}</span>
                  </div>
                )}
                {currentShareSettings?.downloadCount !== undefined && currentShareSettings.downloadCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{currentShareSettings.downloadCount} {currentShareSettings.downloadCount === 1 ? 'download' : 'downloads'}</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="p-6 pt-4 space-y-4">
            {/* Add People */}
            <div className="space-y-3">
              <Label>Add people</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                />
                <Select 
                  value={linkAccess} 
                  onValueChange={(v: any) => setLinkAccess(v)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="download">Can download</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* People List */}
            <div className="space-y-3">
              <Label>People with access</Label>
              
              {/* Owner (you) */}
              <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">You</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">Owner</Badge>
                </div>
              </div>

              {/* Shared Users */}
              {sharedUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={user.accessLevel}
                          onValueChange={(v: any) => {
                            const updated = [...sharedUsers]
                            updated[index].accessLevel = v
                            setSharedUsers(updated)
                          }}
                        >
                          <SelectTrigger className="h-6 text-xs border-0 p-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">Can view</SelectItem>
                            <SelectItem value="download">Can download</SelectItem>
                            <SelectItem value="edit">Can edit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemoveEmail(user.email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {sharedUsers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No people added yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 pt-2 border-t">
          {isShared ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleDisableSharing}
              disabled={isSaving || isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Disable sharing
            </Button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isShared && (
              <Button onClick={handleCreateLink} disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create link'}
              </Button>
            )}
            {isShared && hasUnsavedChanges && (
              <Button onClick={handleUpdateSettings} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update settings'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}