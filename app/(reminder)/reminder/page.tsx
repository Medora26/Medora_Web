"use client";

import DashboardLayout from "@/components/layouts/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Bell, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth/authContext";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  createReminder,
  getUserReminders,
  updateReminderStatus,
  deleteReminder,
  autoUpdateMissedReminders,
} from "@/lib/firebase/service/reminder/service";
import { Label } from "@/components/ui/label";

export default function Page() {
  const { user } = useAuth();

  // FORM STATE
  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reminderBefore, setReminderBefore] = useState(30);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [success, setSuccess] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);

  // FILTERED ARRAYS
  const activeReminders = reminders.filter((r) => r.status === "active");
  const completedReminders = reminders.filter(
    (r) => r.status === "completed"
  );
  const missedReminders = reminders.filter((r) => r.status === "missed");

  // LOAD REMINDERS + AUTO MISSED
  useEffect(() => {
    if (!user) return;

    const loadReminders = async () => {
      try {
        setLoading(true);

        const data = await getUserReminders(user.uid);
        setReminders(data);
      } catch (error) {
        console.error("Failed to load reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, [user]);

const getUrgencyStyle = (appointmentDate: Date) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (appointmentDate.toDateString() === today.toDateString())
    return "border-red-500 bg-red-50 dark:bg-red-500/10 dark:border-red-400";

  if (appointmentDate.toDateString() === tomorrow.toDateString())
    return "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-400";

  return "border-border";
};

  const handleSave = async () => {
    if (!user || !title || !date || !time) return;

    try {
      setLoading(true);

      const appointmentDate = new Date(`${date}T${time}`);
      const sendAt = new Date(
        appointmentDate.getTime() - reminderBefore * 60000
      );

const reminderPayload: any = {
  userId: user.uid,
  userEmail: user.email!,
  title,
  doctor,
  appointmentDate: Timestamp.fromDate(appointmentDate),
  reminderBeforeMinutes: reminderBefore,
  sendAt: Timestamp.fromDate(sendAt),
};

if (notes.trim()) {
  reminderPayload.notes = notes.trim();
}

await createReminder(reminderPayload);

      const updated = await getUserReminders(user.uid);
      setReminders(updated);

      // reset form
      setTitle("");
      setDoctor("");
      setNotes("");
      setDate("");
      setTime("");
      setReminderBefore(30);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    const updated = await getUserReminders(user!.uid);
    setReminders(updated);
  };

  const handleComplete = async (id: string) => {
    await updateReminderStatus(id, "completed");
    const updated = await getUserReminders(user!.uid);
    setReminders(updated);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Appointment Alerts
          </h1>
          <p className="text-muted-foreground">
            Schedule reminders for your medical appointments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CREATE FORM */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Create Reminder</h2>
                  <p className="text-sm text-muted-foreground">
                    Set your next appointment alert.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. MRI Scan"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Doctor / Hospital *
                    </label>
                    <Input
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                      placeholder="Dr. Rao"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time *
                    </label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Reminder Before (minutes) *
                    </label>
                    <Input
                      type="number"
                      value={reminderBefore}
                      onChange={(e) =>
                        setReminderBefore(Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Preparation instructions..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Save Reminder
                      </>
                    )}
                  </Button>
                </div>

                {success && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Reminder saved successfully
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* REMINDER LIST */}
          <div>
            <Card>
              <CardContent className="p-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="missed">Missed</TabsTrigger>
                  </TabsList>

                  {/* ACTIVE */}
                  <TabsContent value="active">
                    {loading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeReminders.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-6 text-center">
                        No active reminders.
                      </div>
                    ) : (
                      activeReminders.map((r) => {
                        const appointmentDate =
                          r.appointmentDate?.toDate();

                        return (
                          <div
                            key={r.id}
                            className={`border rounded-lg p-4 mb-3 ${getUrgencyStyle(
                              appointmentDate
                            )}`}
                          >
                            <h3 className="font-medium">
                              {r.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {appointmentDate?.toLocaleString()}
                            </p>

                            <div className="flex justify-between">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleComplete(r.id)
                                }
                              >
                                Mark Completed
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDelete(r.id)
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>

                  {/* COMPLETED */}
                  <TabsContent value="completed">
                    {completedReminders.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-6 text-center">
                        No completed reminders.
                      </div>
                    ) : (
                      completedReminders.map((r) => (
                        <div
                          key={r.id}
                          className="border rounded-lg p-4 mb-3 bg-green-50"
                        >
                          <h3 className="font-medium">
                            {r.title}
                          </h3>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* MISSED */}
                  <TabsContent value="missed">
                    {missedReminders.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-6 text-center">
                        No missed reminders.
                      </div>
                    ) : (
                      missedReminders.map((r) => (
                        <div
                          key={r.id}
                          className="border rounded-lg p-4 mb-3 bg-gray-50"
                        >
                          <h3 className="font-medium">
                            {r.title}
                          </h3>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}