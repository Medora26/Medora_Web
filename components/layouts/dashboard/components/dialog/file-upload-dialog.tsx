'use client'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, FileText, X, FileImage, File, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth/authContext';
import { uploadToCloudinary, validateFile, extractFileInfo } from '@/lib/cloudinary/file-upload/file-upload';
import { saveDocumentMetadata } from '@/lib/firebase/service/uploadFile/service';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {StorageService} from "@/lib/firebase/service/storage-tracking/service"
interface FileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string; // Optional: if you want to associate with specific patient
  onSuccess?: (documentId: string) => void; // Callback after successful upload
}

// File type categories for filtering
const FILE_TYPE_CATEGORIES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp'],
  pdf: ['application/pdf'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  text: ['text/plain'],
};

// Document categories for medical imaging and reports
const DOCUMENT_CATEGORIES = [
  // Scan/Imaging Categories
  { value: 'xray', label: 'X-Ray', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'mri', label: 'MRI (Magnetic Resonance Imaging)', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'ct', label: 'CT Scan (Computed Tomography)', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'ultrasound', label: 'Ultrasound', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'mammogram', label: 'Mammogram', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'pet', label: 'PET Scan', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'nuclear', label: 'Nuclear Medicine Scan', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'fluoroscopy', label: 'Fluoroscopy', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'angiogram', label: 'Angiogram', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'bone_density', label: 'Bone Density Scan (DEXA)', group: 'Scan Reports', fileTypes: ['image'] },
  
  // Document Categories
  { value: 'prescription', label: 'Prescription', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'lab_report', label: 'Lab Report', group: 'Documents', fileTypes: ['image', 'pdf', 'document'] },
  { value: 'pathology', label: 'Pathology Report', group: 'Documents', fileTypes: ['image', 'pdf', 'document'] },
  { value: 'discharge_summary', label: 'Discharge Summary', group: 'Documents', fileTypes: ['pdf', 'document'] },
  { value: 'operation_note', label: 'Operation Note', group: 'Documents', fileTypes: ['pdf', 'document'] },
  { value: 'consultation', label: 'Consultation Note', group: 'Documents', fileTypes: ['pdf', 'document'] },
  { value: 'vaccination', label: 'Vaccination Record', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'insurance', label: 'Insurance Document', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'identification', label: 'Identification Document', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'other', label: 'Other Medical Document', group: 'Documents', fileTypes: ['image', 'pdf', 'document', 'spreadsheet', 'text'] },
];

// Max file size in bytes (1MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes

const FileUploadDialog = ({ isOpen, onClose, patientId, onSuccess }: FileDialogProps) => {
  const { user: currentUserData } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentDate, setDocumentDate] = useState<Date>();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'cloudinary' | 'firestore' | 'checking' | null>(null);
  const [starAfterUpload, setStarAfterUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file type category
  const getFileTypeCategory = (file: File): string => {
    for (const [category, types] of Object.entries(FILE_TYPE_CATEGORIES)) {
      if (types.includes(file.type)) {
        return category;
      }
    }
    return 'other';
  };

  // Check if file type is valid for selected category
  const isValidFileForCategory = (file: File, categoryValue: string): boolean => {
    if (!categoryValue) return true;
    
    const selectedCategory = DOCUMENT_CATEGORIES.find(c => c.value === categoryValue);
    if (!selectedCategory) return true;
    
    const fileTypeCategory = getFileTypeCategory(file);
    return selectedCategory.fileTypes.includes(fileTypeCategory);
  };

  const handleFileSelect = (file: File) => {
    setFileTypeError(null);
    setFileSizeError(null);
    
    // Check file size first (1MB max)
    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileSizeError(`File size exceeds 1MB limit. Current size: ${sizeInMB}MB`);
      return;
    }

    // Validate file using the enhanced validation
    const validation = validateFile(file, {
      maxSizeMB: 1, // Set to 1MB
      allowedTypes: [
        ...FILE_TYPE_CATEGORIES.image,
        ...FILE_TYPE_CATEGORIES.pdf,
        ...FILE_TYPE_CATEGORIES.document,
        ...FILE_TYPE_CATEGORIES.spreadsheet,
        ...FILE_TYPE_CATEGORIES.text,
      ]
    });

    if (!validation.valid) {
      setFileTypeError(validation.error || 'Invalid file type');
      return;
    }

    setSelectedFile(file);
    
    // Set default document name from file name (without extension)
    if (!documentName) {
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setDocumentName(fileName);
    }

    // Check if file type matches selected category
    if (category && !isValidFileForCategory(file, category)) {
      setFileTypeError('Warning: This file type may not be suitable for the selected category');
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setFileTypeError(null);
    
    // Check if selected file is valid for new category
    if (selectedFile && !isValidFileForCategory(selectedFile, value)) {
      setFileTypeError('Warning: The selected file type may not be suitable for this category');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileTypeError(null);
    setFileSizeError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

/* const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedFile || !currentUserData) {
    toast.error('Please select a file and ensure you are logged in');
    return;
  }

  // Double-check file size before upload
  if (selectedFile.size > MAX_FILE_SIZE) {
    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    toast.error(`File size exceeds 1MB limit. Current size: ${sizeInMB}MB`);
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);
  setUploadStage('cloudinary');

  // DEBUG: Log initial star state
  console.log('🔍 [DEBUG] Star after upload checkbox state:', {
    starAfterUpload,
    type: typeof starAfterUpload,
    value: starAfterUpload
  });

  try {
    // NEW: Check first user storage quota
    setUploadStage('checking');
    toast.info('Checking storage quota')
     
    const userStorage = await StorageService.getUserStorage(currentUserData.uid)
    const newTotalBytes = (userStorage?.totalBytes || 0) + selectedFile.size
    const quotaBytes = userStorage?.quotaBytes || 500 * 1024 * 1024

    if(newTotalBytes > quotaBytes) {
        const used = StorageService.formatBytes(userStorage?.totalBytes || 0);
        const quota = StorageService.formatBytes(quotaBytes);
        const fileSize = StorageService.formatBytes(selectedFile.size)
        toast.error(`Storage quota exceed! You have used ${used} of ${quota}. Cannnot upload ${fileSize}`)
        setIsUploading(false)
        return;
    }


    //Step 1: upload to cloudinary
    setUploadStage('cloudinary')
    toast.info("Uploading to cloudinary....")
    const cloudinaryResponse = await uploadToCloudinary(
      selectedFile,
      currentUserData.uid,
      {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        generateThumbnail: true,
        patientId: patientId,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
    );

    if (!cloudinaryResponse) {
      throw new Error('Failed to upload to Cloudinary');
    }

    // DEBUG: Log Cloudinary response
    console.log('🔍 [DEBUG] Cloudinary upload successful:', {
      publicId: cloudinaryResponse.public_id,
      hasThumbnail: !!cloudinaryResponse.thumbnail_url
    });

    // Step 2: Extract enhanced file info
    const fileInfo = extractFileInfo(cloudinaryResponse);
    const fileTypeCategory = getFileTypeCategory(selectedFile);

    // Step 3: Prepare metadata for Firestore
    setUploadStage('firestore');
    setUploadProgress(0);
    toast.info('Saving document metadata...');

    // Prepare document data with proper typing
    const documentData = {
      userId: currentUserData.uid,
      userEmail: currentUserData.email || undefined,
      patientId: patientId || null,
      documentName,
      documentDate: documentDate ? format(documentDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      category,
      categoryLabel: DOCUMENT_CATEGORIES.find(c => c.value === category)?.label || category,
      description: description || '',
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      fileInfo: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        fileTypeCategory,
      },
      cloudinary: fileInfo,
      isStarred: starAfterUpload,
    };

    // DEBUG: Log the document data being sent to Firestore
    console.log('🔍 [DEBUG] Document data being sent to Firestore:', {
      userId: documentData.userId,
      documentName: documentData.documentName,
      isStarred: documentData.isStarred,
      isStarredType: typeof documentData.isStarred,
      starAfterUploadValue: starAfterUpload,
      fullData: documentData
    });

    // Save to Firestore
    const docId = await saveDocumentMetadata(documentData);

    // DEBUG: Log after Firestore save
    console.log('🔍 [DEBUG] Firestore save complete:', {
      docId,
      starAfterUpload,
      expectedStarredValue: starAfterUpload
    });

    // Success message with star status
    if (starAfterUpload) {
      console.log('🔍 [DEBUG] Showing starred success message (starAfterUpload = true)');
      toast.success('Document uploaded and starred successfully!');
    } else {
      console.log('🔍 [DEBUG] Showing non-starred success message (starAfterUpload = false)');
      toast.success('Document uploaded successfully! but not starred');
    }

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess(docId);
    }
    
    // Reset form and close
    handleRemoveFile();
    setDocumentName('');
    setDocumentDate(undefined);
    setCategory('');
    setDescription('');
    setTags('');
    setStarAfterUpload(false);
    onClose();

  } catch (error) {
    console.error('❌ [DEBUG] Upload failed:', error);
    toast.error('Failed to upload document. Please try again.');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStage(null);
  }
}; */
// In file-upload-dialog.tsx, update the handleSubmit function

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedFile || !currentUserData) {
    toast.error('Please select a file and ensure you are logged in');
    return;
  }

  // Check file size limit
  if (selectedFile.size > MAX_FILE_SIZE) {
    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    toast.error(`File size exceeds 1MB limit. Current size: ${sizeInMB}MB`);
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);
  setUploadStage('cloudinary');

  try {
    // Check user storage quota first
    setUploadStage('checking');
    toast.info('Checking storage quota...');
    
    console.log('🔍 Checking storage for user:', currentUserData.uid);
    
    // Get or initialize user storage
    let userStorage = await StorageService.getUserStorage(currentUserData.uid);
    console.log('🔍 Current user storage:', userStorage);
    
    if (!userStorage) {
      // Initialize if null
      await StorageService.initializeUserStorage(currentUserData.uid);
      userStorage = await StorageService.getUserStorage(currentUserData.uid);
    }
    
    const newTotalBytes = (userStorage?.totalBytes || 0) + selectedFile.size;
    const quotaBytes = userStorage?.quotaBytes || 500 * 1024 * 1024;
    
    console.log('🔍 Storage check:', {
      currentUsed: userStorage?.totalBytes,
      fileSize: selectedFile.size,
      newTotal: newTotalBytes,
      quota: quotaBytes,
      wouldExceed: newTotalBytes > quotaBytes
    });
    
    if (newTotalBytes > quotaBytes) {
      const used = StorageService.formatBytes(userStorage?.totalBytes || 0);
      const quota = StorageService.formatBytes(quotaBytes);
      const fileSize = StorageService.formatBytes(selectedFile.size);
      
      toast.error(`Storage quota exceeded! You have used ${used} of ${quota}. Cannot upload ${fileSize}.`);
      setIsUploading(false);
      return;
    }

    // Step 1: Upload to Cloudinary
    setUploadStage('cloudinary');
    toast.info('Uploading to Cloudinary...');
    
    const cloudinaryResponse = await uploadToCloudinary(
      selectedFile,
      currentUserData.uid,
      {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        generateThumbnail: true,
        patientId: patientId,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
    );

    if (!cloudinaryResponse) {
      throw new Error('Failed to upload to Cloudinary');
    }

    // Step 2: Extract file info
    const fileInfo = extractFileInfo(cloudinaryResponse);
    const fileTypeCategory = getFileTypeCategory(selectedFile);

    // Step 3: Prepare metadata for Firestore
    setUploadStage('firestore');
    setUploadProgress(0);
    toast.info('Saving document metadata...');

    const documentData = {
      userId: currentUserData.uid,
      userEmail: currentUserData.email || undefined,
      patientId: patientId || null,
      documentName,
      documentDate: documentDate ? format(documentDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      category,
      categoryLabel: DOCUMENT_CATEGORIES.find(c => c.value === category)?.label || category,
      description: description || '',
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      fileInfo: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        fileTypeCategory,
      },
      cloudinary: fileInfo,
      isStarred: starAfterUpload,
    };

    // Save to Firestore
    console.log('🔍 Saving document to Firestore...');
    const docId = await saveDocumentMetadata(documentData);
    console.log('🔍 Document saved with ID:', docId);

    // Step 4: Update user storage
    console.log('🔍 Updating user storage...');
    const storageResult = await StorageService.addFileStorage(currentUserData.uid, selectedFile.size);
    console.log('🔍 Storage update result:', storageResult);

    // Verify storage was updated
    const updatedStorage = await StorageService.getUserStorage(currentUserData.uid);
    console.log('🔍 Updated storage:', updatedStorage);

    if (storageResult.success) {
      console.log('✅ Storage updated successfully!');
    } else if (storageResult.quotaExceeded) {
      console.warn('⚠️ Storage quota exceeded after upload? This should not happen!');
    }

    // Success message
    if (starAfterUpload) {
      toast.success('Document uploaded and starred successfully!');
    } else {
      toast.success('Document uploaded successfully!');
    }

    if (onSuccess) {
      onSuccess(docId);
    }
    
    // Reset form and close
    handleRemoveFile();
    setDocumentName('');
    setDocumentDate(undefined);
    setCategory('');
    setDescription('');
    setTags('');
    setStarAfterUpload(false);
    onClose();

  } catch (error) {
    console.error('❌ Upload failed:', error);
    toast.error('Failed to upload document. Please try again.');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStage(null);
  }
};
  // Get icon based on file type
  const getFileIcon = (file: File) => {
    const fileType = getFileTypeCategory(file);
    switch (fileType) {
      case 'image':
        return <FileImage className="w-8 h-8 text-blue-600" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-600" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  // Get upload stage message
  const getUploadStageMessage = () => {
    switch (uploadStage) {
      case 'cloudinary':
        return 'Uploading to Cloudinary...';
      case 'firestore':
        return 'Saving document metadata...';
      default:
        return 'Uploading...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className="text-2xl">Upload Medical Documents</DialogTitle>
          <DialogDescription>
            Upload and organize your medical documents securely with Medora. 
            Add details to make them easily searchable and filterable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="file">Document File *</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border",
                selectedFile ? "" : "dark:hover:bg-neutral-950 hover:bg-blue-50 cursor-pointer",
                (fileTypeError || fileSizeError) ? "border-red-500" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              
              {isUploading ? (
                <div className="text-center py-4">
                  <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                  <p className="mt-2 text-sm font-medium text-gray-700">{getUploadStageMessage()}</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full max-w-md mx-auto">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{uploadProgress}% complete</p>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center gap-4">
                  {previewUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center">
                      {getFileIcon(selectedFile)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1]?.toUpperCase() || selectedFile.type}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: Images (JPEG, PNG, GIF, WEBP, TIFF), PDF, Documents (DOC, DOCX), Spreadsheets (XLS, XLSX)
                  </p>
                  <p className="text-xs font-medium text-blue-600 mt-1">
                    Maximum file size: 1MB
                  </p>
                </div>
              )}
            </div>
            {fileTypeError && (
              <p className="text-sm text-red-500 mt-1">{fileTypeError}</p>
            )}
            {fileSizeError && (
              <p className="text-sm text-red-500 mt-1">{fileSizeError}</p>
            )}
          </div>

          {/* Star after upload option */}
         {/*  // Update the checkbox section in the JSX: */}
{selectedFile && !isUploading && (
  <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
    <Checkbox 
      id="starAfterUpload" 
      checked={starAfterUpload}
      onCheckedChange={(checked) => {
        // DEBUG: Log checkbox change
        console.log('🔍 [DEBUG] Checkbox changed:', {
          checked,
          checkedType: typeof checked,
          willSetTo: checked === true
        });
        setStarAfterUpload(checked === true);
      }}
    />
    <Label 
      htmlFor="starAfterUpload" 
      className="flex items-center gap-2 text-sm font-medium cursor-pointer"
    >
      <Star className={cn(
        "h-4 w-4",
        starAfterUpload ? "fill-blue-400 text-blue-400" : "text-gray-400"
      )} />
      Star this document after upload (mark as important)
    </Label>
  </div>
)}

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="documentName">Document Name *</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., Chest X-Ray 2024"
              disabled={isUploading}
              required
            />
          </div>

          {/* Document Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Document Category *</Label>
            <Select value={category} onValueChange={handleCategoryChange} disabled={isUploading} required>
              <SelectTrigger>
                <SelectValue placeholder="Select document category" />
              </SelectTrigger>
              <SelectContent>
                {/* Group Scan Reports */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Scan Reports
                </div>
                {DOCUMENT_CATEGORIES.filter(cat => cat.group === 'Scan Reports').map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
                
                {/* Group Documents */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                  Documents
                </div>
                {DOCUMENT_CATEGORIES.filter(cat => cat.group === 'Documents').map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Date */}
          <div className="space-y-2">
            <Label>Document Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !documentDate && "text-muted-foreground"
                  )}
                  disabled={isUploading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {documentDate ? format(documentDate, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={documentDate}
                  onSelect={setDocumentDate}
                  initialFocus
                  disabled={isUploading}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes about this document..."
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Tags for better filtering */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., cardiology, follow-up, urgent (comma separated)"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500">
              Add tags to improve searchability and filtering
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedFile || !documentName || !category || !documentDate || !!fileSizeError || isUploading}
              className="min-w-[140px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStage === 'cloudinary' ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;