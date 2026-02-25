import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { sendReminderEmail } from "@/lib/resend/sendReminderEmail";

export async function POST() {
  try {
    const now = Timestamp.now(); 

    // get reminders ready to send
    const q = query(
      collection(db, "reminders"),
      where("status", "==", "active"),
      where("sendAt", "<=", now)
    );

    const snapshot = await getDocs(q);

    for (const reminderDoc of snapshot.docs) {
      const data: any = reminderDoc.data();

await sendReminderEmail({
  to: data.userEmail,
  patientName: data.userEmail.split("@")[0],
  title: data.title,
  doctor: data.doctor,
  notes: data.notes,
  appointmentDate: data.appointmentDate.toDate(),
});
      // mark reminder completed after email sent
      await updateDoc(doc(db, "reminders", reminderDoc.id), {
        status: "completed",
      });
    }

    return NextResponse.json({
      success: true,
      sent: snapshot.docs.length,
    });
  } catch (error) {
    console.error("Reminder email job failed:", error);
    return NextResponse.json({ success: false });
  }
}