// lib/cloudinary/service.ts
interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  original_filename: string;
  created_at: string;
  etag: string;
  placeholder: boolean;
  url: string;
  width?: number;
  height?: number;
  thumbnail_url?: string; // Add thumbnail URL
  preview_url?: string; // Add preview URL for non-images
}

interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: {
    thumbnail?: { width: number; height: number; crop: string };
    preview?: { width: number; height: number; crop: string };
  };
}



export const uploadToCloudinary = async (
  file: File,
  userId: string,
  options?: {
    onProgress?: (progress: number) => void;
    generateThumbnail?: boolean;
    patientId?: string;
    tags?: string[];
  }
): Promise<CloudinaryUploadResponse | null> => {
  const uploadId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${uploadId}] 🚀 Cloudinary upload started for user: ${userId}`);
    console.log(`[${uploadId}] 📄 File details:`, {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);
    
    // Create folder structure
    const baseFolder = `medical_documents`;
    const userFolder = `user_${userId}`;
    const patientFolder = options?.patientId ? `patient_${options.patientId}` : '';
    const timestamp = Date.now();
    const sanitizedFileName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    
    // Build folder path
    const folderParts = [baseFolder, userFolder];
    if (patientFolder) {
      folderParts.push(patientFolder);
    }
    
    // Generate public_id
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const publicId = `${folderParts.join('/')}/${fileName}`;
    formData.append('public_id', publicId);
    
    // Add tags if provided
    if (options?.tags?.length) {
      formData.append('tags', options.tags.join(','));
    }

    // FIX: Properly format context as a JSON string
    // Cloudinary expects context in format: key1=value1|key2=value2
    // But we can also pass as a single JSON string
    const contextData = {
      userId: userId,
      patientId: options?.patientId || '',
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
      fileType: file.type
    };
    
    // Convert to JSON string and then to base64 to avoid encoding issues
    const contextJson = JSON.stringify(contextData);
    formData.append('context', contextJson);
    
    console.log(`[${uploadId}] 📄 Upload configuration:`, {
      publicId,
      folder: folderParts.join('/'),
      hasTags: !!options?.tags?.length,
      hasPatient: !!options?.patientId,
      contextSize: contextJson.length
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[${uploadId}] 🚀 Cloudinary response received after ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${uploadId}] ❌ Upload failed:`, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Generate thumbnail URL if needed
    const thumbnailUrl = options?.generateThumbnail 
      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${publicId}`
      : undefined;
    
    const enhancedData = {
      ...data,
      thumbnail_url: thumbnailUrl,
    };
    
    console.log(`[${uploadId}] ✅ Upload successful!`, {
      publicId: data.public_id,
      size: `${(data.bytes / 1024).toFixed(2)} KB`,
      hasThumbnail: !!thumbnailUrl
    });
    
    if (options?.onProgress) {
      options.onProgress(100);
    }

    return enhancedData;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${uploadId}] 🚀 Cloudinary upload error:`, error);
    return null;
  }
};

// Enhanced URL generation with multiple format options
export const getCloudinaryUrl = (
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
    quality?: number | 'auto';
    format?: 'auto' | 'jpg' | 'png' | 'webp' | 'pdf';
    effect?: string;
    flags?: string[];
    radius?: number | 'max';
    border?: string;
    background?: string;
    dpr?: number | 'auto';
  }
): string => {
  if (!publicId) return '';
  
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    effect,
    flags = [],
    radius,
    border,
    background,
    dpr = 'auto'
  } = options || {};
  
  const transformations = [];
  
  // Image optimization
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);
  transformations.push(`dpr_${dpr}`);
  
  // Size transformations
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  
  // Effects and enhancements
  if (effect) transformations.push(`e_${effect}`);
  if (radius) transformations.push(`r_${radius}`);
  if (border) transformations.push(`bo_${border}`);
  if (background) transformations.push(`b_${background}`);
  
  // Flags
  flags.forEach(flag => transformations.push(`fl_${flag}`));
  
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : '';
  
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
};

// Get optimized thumbnail
export const getThumbnailUrl = (
  publicId: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  const sizes = {
    small: { width: 100, height: 100 },
    medium: { width: 200, height: 200 },
    large: { width: 400, height: 400 }
  };
  
  return getCloudinaryUrl(publicId, {
    ...sizes[size],
    crop: 'thumb',
    quality: 60,
    flags: ['preserve_transparency']
  });
};

// Generate progressive loading placeholder
export const getPlaceholderUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    width: 20,
    quality: 20,
    effect: 'blur:1000',
    flags: ['progressive']
  });
};

// Delete from Cloudinary (requires signed request)
export const deleteFromCloudinary = async (
  publicId: string,
  userId: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting from Cloudinary: ${publicId}`);
    
    // You'll need to implement a server endpoint for this
    // as it requires API secret
    const response = await fetch('/api/cloudinary/documents/upload/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId, userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete from Cloudinary');
    }
    
    const data = await response.json();
    console.log(`✅ Deleted from Cloudinary:`, data);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    return false;
  }
};

// Bulk delete from Cloudinary
/* export const bulkDeleteFromCloudinary = async (
  publicIds: string[],
  userId: string
): Promise<{ success: string[]; failed: string[] }> => {
  const results = { success: [], failed: [] };
  
  for (const publicId of publicIds) {
    try {
      const success = await deleteFromCloudinary(publicId, userId);
      if (success) {
        results.success.push(publicId);
      } else {
        results.failed.push(publicId);
      }
    } catch (error) {
      results.failed.push(publicId);
    }
  }
  
  return results;
};
 */
// Get document preview URL (handles PDFs and images)
/* export const getPreviewUrl = (
  publicId: string,
  fileType: string
): string => {
  if (fileType === 'application/pdf') {
    // For PDFs, generate a page preview
    return getCloudinaryUrl(publicId, {
      format: 'jpg',
      width: 800,
      page: 1,
      flags: ['layer_apply']
    });
  }
  
  // For images, return optimized preview
  return getCloudinaryUrl(publicId, {
    width: 1024,
    quality: 80,
    format: 'auto'
  });
}; */

// Generate share-specific URL with expiration
export const getShareableUrl = (
  publicId: string,
  shareId: string,
  expiresAt?: Date
): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  
  if (expiresAt) {
    // Add timestamp for cache busting on expiration
    const timestamp = expiresAt.getTime();
    return `${baseUrl}/api/share/${shareId}?exp=${timestamp}&publicId=${encodeURIComponent(publicId)}`;
  }
  
  return `${baseUrl}/api/share/${shareId}?publicId=${encodeURIComponent(publicId)}`;
};

// Extract metadata from Cloudinary response
export const extractFileInfo = (cloudinaryResponse: CloudinaryUploadResponse) => {
  return {
    publicId: cloudinaryResponse.public_id,
    url: cloudinaryResponse.secure_url,
    thumbnailUrl: cloudinaryResponse.thumbnail_url || 
      `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${cloudinaryResponse.public_id}`,
    format: cloudinaryResponse.format,
    bytes: cloudinaryResponse.bytes,
    originalFilename: cloudinaryResponse.original_filename,
    width: cloudinaryResponse.width,
    height: cloudinaryResponse.height,
  };
};
// Validate file before upload
export const validateFile = (file: File, options?: {
  maxSizeMB?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } => {
  const { maxSizeMB = 100, allowedTypes = [] } = options || {};
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Supported types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check for medical documents specific validation
  const medicalFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/dicom', // DICOM medical imaging
    'application/dicom'
  ];
  
  if (!medicalFileTypes.includes(file.type) && !file.type.startsWith('image/')) {
    console.warn(`⚠️ Unusual file type for medical documents: ${file.type}`);
  }
  
  return { valid: true };
};

// Get folder structure for user
export const getUserFolderStructure = (userId: string, patientId?: string) => {
  const basePath = `medical_documents/user_${userId}`;
  console.log("userID", userId)
  if (patientId) {
    return {
      root: basePath,
      patient: `${basePath}/patient_${patientId}`,
      all: `${basePath}/patient_${patientId}/all`,
      thumbnails: `${basePath}/patient_${patientId}/thumbnails`
    };
  }
  
  return {
    root: basePath,
    all: `${basePath}/all`,
    thumbnails: `${basePath}/thumbnails`
  };
};

// Test function with enhanced checks
/* export const testCloudinaryConfig = async (): Promise<{
  success: boolean;
  details: Record<string, any>;
}> => {
  console.log('🧪 Testing Cloudinary configuration...');
  
  const hasUploadPreset = !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const hasCloudName = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  const details = {
    uploadPreset: hasUploadPreset ? '✅ Present' : '❌ Missing',
    cloudName: hasCloudName ? '✅ Present' : '❌ Missing',
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Configuration check:', details);
  
  if (!hasUploadPreset || !hasCloudName) {
    console.error('❌ Cloudinary configuration is incomplete!');
    return { success: false, details };
  }
  
  
  try {
    const testUrl = getCloudinaryUrl('test', { width: 100 });
    details.testUrl = testUrl ? '✅ Generated' : '❌ Failed';
  } catch (error) {
    details.testUrl = '❌ Failed';
  }
  
  console.log('✅ Cloudinary configuration looks good!');
  return { success: true, details };
}; */