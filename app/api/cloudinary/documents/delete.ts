// pages/api/cloudinary/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from 'cloudinary';

// Configure Cloudinary with API secret (server-side only)
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { publicId, userId } = req.body;

    if (!publicId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify that the publicId belongs to the user (security check)
    if (!publicId.includes(`user_${userId}`)) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }

    // Delete from Cloudinary
    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return res.status(200).json({ success: true, result });
    } else {
      return res.status(400).json({ error: 'Failed to delete', result });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}