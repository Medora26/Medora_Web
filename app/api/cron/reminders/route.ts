import { NextResponse } from "next/server";

export async function GET() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reminders/send`, {
      method: "POST",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron reminder failed:", error);
    return NextResponse.json({ success: false });
  }
}