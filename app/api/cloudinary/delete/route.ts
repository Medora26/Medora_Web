import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json({ success: false, error: "Missing publicId" });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto", 
    });

    console.log("Cloudinary delete result:", result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    return NextResponse.json({ success: false });
  }
}