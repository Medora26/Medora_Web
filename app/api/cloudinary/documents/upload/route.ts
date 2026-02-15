// app/api/cloudinary/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[${requestId}] 🚀 Cloudinary API route started`);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      console.error(`[${requestId}] ❌ Missing file or userId`);
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] 📁 File details:`, {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type,
      userId: userId
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Create dynamic folder structure
    const timestamp = Date.now();
    const sanitizedFileName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `media/documents/${userId}/${timestamp}_${sanitizedFileName}`;
    
    console.log(`[${requestId}] 📂 Target public_id: ${publicId}`);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          public_id: publicId,
          resource_type: 'auto',
          tags: [`user_${userId}`, 'medical_document'],
        },
        (error, result) => {
          if (error) {
            console.error(`[${requestId}] ❌ Cloudinary error:`, error);
            reject(error);
          } else {
            console.log(`[${requestId}] ✅ Upload successful`);
            resolve(result);
          }
        }
      );
    });

    return NextResponse.json(uploadResult, { status: 200 });

  } catch (error) {
    console.error(`[${requestId}] ❌ Upload failed:`, error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}