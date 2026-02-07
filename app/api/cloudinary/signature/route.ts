// app/api/cloudinary/signature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Define the type for params
interface CloudinaryParams {
  timestamp: number;
  folder: string;
  tags: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, folder = 'medora/documents' } = await request.json();
    
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const targetFolder = `${folder}/${userId}`;
    
    // Create params for signature with explicit type
    const params: CloudinaryParams = {
      timestamp,
      folder: targetFolder,
      tags: `medora,medical,user_${userId}`
    };

    // Generate signature - fix the TypeScript issue
    const sortedParams = (Object.keys(params) as (keyof CloudinaryParams)[])
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringToSign = `${sortedParams}${apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp: timestamp.toString(),
      apiKey,
      folder: targetFolder,
      cloudName
    });
    
  } catch (error: any) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate signature' },
      { status: 500 }
    );
  }
}