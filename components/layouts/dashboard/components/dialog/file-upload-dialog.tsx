import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, FileText, X, FileImage, File } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface FileDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

const FileUploadDialog = ({ isOpen, onClose }: FileDialogProps) => {
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
    
    // Check file type
    const validTypes = [
      ...FILE_TYPE_CATEGORIES.image,
      ...FILE_TYPE_CATEGORIES.pdf,
      ...FILE_TYPE_CATEGORIES.document,
      ...FILE_TYPE_CATEGORIES.spreadsheet,
      ...FILE_TYPE_CATEGORIES.text,
    ];
    
    if (!validTypes.includes(file.type)) {
      setFileTypeError('Unsupported file type. Please upload images, PDFs, documents, or spreadsheets.');
      return;
    }

    // Check file size (max 1MB)
    if (file.size > MAX_FILE_SIZE) {
      setFileSizeError(`File size should be less than 1MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    // Get file type category for filtering
    const fileTypeCategory = getFileTypeCategory(selectedFile);
    
    // Handle form submission here
    console.log({
      file: selectedFile,
      fileType: selectedFile.type,
      fileTypeCategory, // This will help with filtering by file type
      documentName,
      documentDate,
      category,
      description,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    });
    
    // Reset form and close
    handleRemoveFile();
    setDocumentName('');
    setDocumentDate(undefined);
    setCategory('');
    setDescription('');
    setTags('');
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[70vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Upload Medical Documents</DialogTitle>
          <DialogDescription
           className='font-semibold'
          >
            Upload and organize your medical documents securely with Medora. 
           
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="file">Document File *</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border",
                selectedFile ? "" : "dark:hover:bg-neutral-950 hover:bg-blue-50 cursor-pointer",
                (fileTypeError || fileSizeError) ? "border-red-500" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              
              {selectedFile ? (
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
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-1 flex flex-col items-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 font-bold text-sm text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs max-w-md text-center font-semibold text-gray-200">
                    Supported formats: Images (JPEG, PNG, GIF, WEBP), PDF, Documents (DOC, DOCX), Spreadsheets (XLS, XLSX)
                  </p>
                  <p className="text-xs font-medium text-blue-400 mt-1">
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

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="documentName">Document Name *</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., Chest X-Ray 2024"
              required
            />
          </div>

          {/* Document Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Document Category *</Label>
            <Select value={category} onValueChange={handleCategoryChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select document category" />
              </SelectTrigger>
              <SelectContent>
                {/* Group Scan Reports */}
                <div className="px-2 py-1.5 text-xs font-semibold opacity-70">
                  Scan Reports
                </div>
                {DOCUMENT_CATEGORIES.filter(cat => cat.group === 'Scan Reports').map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
                
                {/* Group Documents */}
                <div className="px-2 py-1.5 text-xs font-semibold opacity-70 mt-2">
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
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !documentDate && "text-muted-foreground"
                  )}
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
            />
            <p className="text-xs text-gray-500">
              Add tags to improve searchability and filtering
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedFile || !documentName || !category || !documentDate || !!fileSizeError}
            >
              Upload Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;