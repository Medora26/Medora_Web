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
}

export const uploadToCloudinary = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse | null> => {
  const uploadId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${uploadId}] 🚀 Cloudinary upload started for user: ${userId}`);
    console.log(`[${uploadId}] 📁 File details:`, {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Log environment config
    console.log(`[${uploadId}] ⚙️ Cloudinary config:`, {
      hasUploadPreset: !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      hasCloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);
    
    // CRITICAL: Set the public_id to include the full folder path
    // This ensures the folder structure is created exactly as specified
    const timestamp = Date.now();
    const sanitizedFileName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `media/documents/${userId}/${timestamp}_${sanitizedFileName}`;
    formData.append('public_id', publicId);
    
    console.log(`[${uploadId}] 📂 Setting public_id: ${publicId}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[${uploadId}] ⏱️ Cloudinary response received after ${duration}ms`);
    console.log(`[${uploadId}] 📡 Response status:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${uploadId}] ❌ Upload failed with status ${response.status}:`, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`[${uploadId}] ✅ Upload successful!`);
    console.log(`[${uploadId}] 📦 Cloudinary response:`, {
      publicId: data.public_id,
      format: data.format,
      size: `${(data.bytes / 1024).toFixed(2)} KB`,
      folder: data.public_id.split('/').slice(0, -1).join('/'),
      filename: data.public_id.split('/').pop(),
      url: data.secure_url ? data.secure_url.substring(0, 50) + '...' : 'N/A',
    });
    
    if (onProgress) {
      onProgress(100);
      console.log(`[${uploadId}] 📊 Progress: 100%`);
    }

    console.log(`[${uploadId}] ✨ Upload completed successfully in ${duration}ms`);
    return data;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${uploadId}] ❌ Cloudinary upload error after ${duration}ms:`, error);
    
    if (error instanceof Error) {
      console.error(`[${uploadId}] 🔥 Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return null;
  }
};

// Helper function to get user's folder path
export const getUserCloudinaryFolder = (userId: string): string => {
  return `media/documents/${userId}`;
};

// Helper function to extract userId from public_id
export const extractUserIdFromPublicId = (publicId: string): string | null => {
  // Matches pattern: media/documents/USER_ID/filename
  const matches = publicId.match(/media\/documents\/([^\/]+)/);
  return matches ? matches[1] : null;
};

// Generate optimized URLs
export const getCloudinaryUrl = (
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  }
): string => {
  console.log(`🔗 Generating Cloudinary URL for:`, {
    publicId,
    options: options || 'default'
  });
  
  const { width, height, crop = 'fill', quality = 80, format = 'auto' } = options || {};
  
  let transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : '';
  
  const url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
  
  console.log(`🔗 Generated URL:`, url.substring(0, 60) + '...');
  return url;
};

// Test function
export const testCloudinaryConfig = async (): Promise<boolean> => {
  console.log('🧪 Testing Cloudinary configuration...');
  
  const hasUploadPreset = !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const hasCloudName = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  console.log('📋 Configuration check:', {
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: hasUploadPreset ? '✅ Present' : '❌ Missing',
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: hasCloudName ? '✅ Present' : '❌ Missing',
    CLOUDINARY_API_KEY: '⚠️ Not needed for unsigned uploads',
    CLOUDINARY_API_SECRET: '⚠️ Not needed for unsigned uploads'
  });
  
  if (!hasUploadPreset || !hasCloudName) {
    console.error('❌ Cloudinary configuration is incomplete!');
    return false;
  }
  
  console.log('✅ Cloudinary configuration looks good!');
  return true;
};