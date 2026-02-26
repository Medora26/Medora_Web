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
  Mail,
  Plus,
  X,
  Globe,
  Lock,
  Users,
  Clock,
  Download,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  Timestamp 
} from 'firebase/firestore'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId?: string
  fileName?: string
  currentShareSettings?: {
    shareId?: string
    accessLevel: 'view' | 'download' | 'edit' | 'restricted'
    requirePassword: boolean
    hasPassword: boolean
    expiresAt?: Date
    allowedEmails?: string[]
    viewCount?: number
    downloadCount?: number
  }
}

interface ShareUser {
  email: string
  status: 'pending' | 'active'
  accessLevel: 'view' | 'download' | 'edit'
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  fileId, 
  fileName,
  currentShareSettings 
}: ShareModalProps) {
  const [shareLink, setShareLink] = useState('')
  const [accessLevel, setAccessLevel] = useState<'anyone' | 'restricted'>(
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
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [expiryDate, setExpiryDate] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [sharedUsers, setSharedUsers] = useState<ShareUser[]>([])
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('link')

  // Generate or load share link
  useEffect(() => {
    if (isOpen && fileId) {
      if (currentShareSettings?.shareId) {
        const baseUrl = window.location.origin
        setShareLink(`${baseUrl}/s/${currentShareSettings.shareId}`)
      } else {
        // Generate new share ID
        const newShareId = Math.random().toString(36).substring(2, 15)
        const baseUrl = window.location.origin
        setShareLink(`${baseUrl}/s/${newShareId}`)
      }
    }
  }, [isOpen, fileId, currentShareSettings])

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
  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    if (sharedUsers.some(u => u.email === newEmail)) {
      toast.error('User already added')
      return
    }

    setSharedUsers([
      ...sharedUsers,
      {
        email: newEmail,
        status: 'pending',
        accessLevel: linkAccess
      }
    ])
    setNewEmail('')
  }

  // Handle remove email
  const handleRemoveEmail = (email: string) => {
    setSharedUsers(sharedUsers.filter(u => u.email !== email))
  }

  // Handle save share settings
/*   const handleSave = async () => {
    setIsSaving(true)
    try {
      const fileRef = doc(db, 'documents', fileId)
      
      // Generate share ID if not exists
      const shareId = currentShareSettings?.shareId || 
        Math.random().toString(36).substring(2, 15)

      const shareSettings = {
        shareId,
        accessLevel: accessLevel === 'restricted' ? 'restricted' : linkAccess,
        requirePassword,
        ...(requirePassword && password ? { password } : {}),
        ...(expiryEnabled && expiryDate ? { 
          expiresAt: Timestamp.fromDate(new Date(expiryDate)) 
        } : {}),
        allowedEmails: sharedUsers.map(u => u.email),
        viewCount: currentShareSettings?.viewCount || 0,
        downloadCount: currentShareSettings?.downloadCount || 0,
        updatedAt: Timestamp.now()
      }

      await updateDoc(fileRef, {
        shareSettings,
        isShared: true
      })

      toast.success('Share settings updated')
      onClose()
    } catch (error) {
      console.error('Error saving share settings:', error)
      toast.error('Failed to update share settings')
    } finally {
      setIsSaving(false)
    }
  } */

  // Handle disable sharing
 /*  const handleDisableSharing = async () => {
    setIsSaving(true)
    try {
      const fileRef = doc(db, 'documents', fileId)
      await updateDoc(fileRef, {
        shareSettings: null,
        isShared: false
      })
      toast.success('Sharing disabled')
      onClose()
    } catch (error) {
      console.error('Error disabling sharing:', error)
      toast.error('Failed to disable sharing')
    } finally {
      setIsSaving(false)
    }
  }
 */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Share "Yahiko.png"</DialogTitle>
          <DialogDescription>
            Add people, groups, and manage access permissions
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
                {accessLevel === 'anyone' ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <Select 
                  value={accessLevel} 
                  onValueChange={(v: 'anyone' | 'restricted') => setAccessLevel(v)}
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
                  {accessLevel === 'anyone' 
                    ? 'Anyone on the internet can access'
                    : 'Only specific people can access'
                  }
                </span>
              </div>
            </div>

            {/* Link Access Level (shown only for anyone) */}
            {accessLevel === 'anyone' && (
              <div className="space-y-3">
                <Label>Access level</Label>
                <Select value={linkAccess} onValueChange={(v: any) => setLinkAccess(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="download">Can download</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Share Link Display */}
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
            </div>

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
                {currentShareSettings?.viewCount !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{currentShareSettings.viewCount} views</span>
                  </div>
                )}
                {currentShareSettings?.downloadCount !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{currentShareSettings.downloadCount} downloads</span>
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
                <Select value={linkAccess} onValueChange={(v: any) => setLinkAccess(v)}>
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
                    <AvatarFallback>SU</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Subhro (you)</p>
                    <p className="text-xs text-muted-foreground">subhrokolay2@gmail.com</p>
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
                        <p className="text-xs text-muted-foreground">
                          {user.status === 'pending' ? 'Pending' : 'Active'}
                        </p>
                        <span>•</span>
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
          {currentShareSettings?.shareId ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
            /*   onClick={handleDisableSharing} */
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Disable sharing
            </Button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button /* onClick={handleSave} */ disabled={isSaving}>
              {isSaving ? 'Saving...' : currentShareSettings?.shareId ? 'Update' : 'Create link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}