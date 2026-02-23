import { db } from "@/lib/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

export interface ReminderData {
  userId: string;
  userEmail: string;
  title: string;
  doctor?: string;
  notes?: string;
  appointmentDate: Timestamp;
  reminderBeforeMinutes: number;
  sendAt: Timestamp;
}

const remindersCollection = collection(db, "reminders");

// CREATE REMINDER
export const createReminder = async (
  data: ReminderData
): Promise<string> => {
  const docRef = await addDoc(remindersCollection, {
    ...data,
    status: "active", // active | completed | missed
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

// GET USER REMINDERS
export const getUserReminders = async (userId: string) => {
const q = query(
  remindersCollection,
  where("userId", "==", userId),
  orderBy("appointmentDate", "asc")
);

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// UPDATE REMINDER STATUS
export const updateReminderStatus = async (
  reminderId: string,
  status: "active" | "completed" | "missed"
) => {
  const ref = doc(db, "reminders", reminderId);

  await updateDoc(ref, {
    status,
  });
};

// DELETE REMINDER
export const deleteReminder = async (reminderId: string) => {
  const ref = doc(db, "reminders", reminderId);
  await deleteDoc(ref);
};
export const autoUpdateMissedReminders = async (userId: string) => {
  const now = new Date();

  const q = query(
    remindersCollection,
    where("userId", "==", userId),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);

  const updates = snapshot.docs.map(async (docItem) => {
    const data: any = docItem.data();
    const appointmentDate = data.appointmentDate.toDate();

   if (appointmentDate < now && data.status === "active") {
  await updateDoc(doc(db, "reminders", docItem.id), {
    status: "missed",
  });
}
  });

  await Promise.all(updates);
};