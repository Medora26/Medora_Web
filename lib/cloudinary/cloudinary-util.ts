// lib/cloudinary/cloudinary-util.ts
export interface CloudinaryUploadResponse {
  success: boolean;
  userId: string;
  url?: string;
  publicId?: string;
  resourceType?: string;
  error?: string;
}

// lib/cloudinary/cloudinary-util.ts
export async function uploadToCloudinary(
  file: File,
  userId: string
): Promise<CloudinaryUploadResponse> {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      throw new Error('Cloudinary cloud name missing');
    }

    // 1. Get signature from backend API
    const signatureResponse = await fetch('/api/cloudinary/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        folder: `medora/documents/${userId}`
      })
    });

    if (!signatureResponse.ok) {
      throw new Error('Failed to get upload signature');
    }

    const { signature, timestamp, apiKey, folder } = await signatureResponse.json();

    // 2. Upload to Cloudinary with signed parameters
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('tags', `medora,medical,user_${userId}`);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Cloudinary error:', data);
      throw new Error(data?.error?.message || 'Upload failed');
    }

    console.log('✅ Cloudinary upload successful:', {
      url: data.secure_url,
      publicId: data.public_id,
      folder: data.folder
    });

    return {
      success: true,
      userId,
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type,
    };
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    return {
      success: false,
      userId,
      error: error.message || 'Cloudinary upload failed',
    };
  }
}
// Helper to generate signature (CLIENT-SIDE - UNSAFE for production!)
/* async function generateSignature(params: any, apiSecret: string): Promise<string> {
  // ⚠️ Never expose apiSecret on client-side in production!
  // This is only for testing/demo
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const stringToSign = `${sortedParams}${apiSecret}`;
  
  // Use Web Crypto API for SHA-1
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
} */