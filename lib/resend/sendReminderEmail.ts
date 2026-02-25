import { resend } from "./client";
import { MEDORA_FULL_LIGHT } from "@/public/logo/logo";

export const sendReminderEmail = async ({
  to,
  patientName,
  title,
  doctor,
  notes,
  appointmentDate,
}: {
  to: string;
  patientName?: string;
  title: string;
  doctor?: string;
  notes?: string;
  appointmentDate: Date;
}) => {
  try {
    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    let urgencyBanner = "";
    let countdownText = "";

    if (diffMinutes <= 0) {
      urgencyBanner = "⚠️ Appointment time reached";
    } else if (diffHours < 24) {
      urgencyBanner = "🔴 Appointment today";
    } else if (diffHours < 48) {
      urgencyBanner = "🟡 Appointment tomorrow";
    }

    if (diffHours > 0) {
      countdownText = `In ${diffHours} hour(s)`;
    } else {
      countdownText = `In ${diffMinutes} minute(s)`;
    }

    await resend.emails.send({
      from: "Medora <onboarding@resend.dev>",
      to,
      subject: `Reminder: ${title}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f3f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f1f5f9;">
              <img
                src="${MEDORA_FULL_LIGHT}"
                alt="Medora"
                style="height:32px;margin-bottom:10px;display:block;"
              />
              <p style="margin:0;font-size:13px;color:#64748b;">
                Smart Medical Dashboard
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:20px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:#475569;">
                Hi ${patientName || "there"},
              </p>

              ${
                urgencyBanner
                  ? `
                <div style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:18px;">
                  ${urgencyBanner}
                </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:16px 32px 32px 32px;">

              <span style="display:inline-block;padding:6px 12px;background:#eef2ff;color:#3730a3;border-radius:999px;font-size:12px;font-weight:500;">
                Appointment Reminder
              </span>

              <h2 style="margin:16px 0 12px 0;font-size:18px;color:#0f172a;">
                ${title}
              </h2>

              <p style="margin:0 0 24px 0;color:#475569;font-size:14px;line-height:1.6;">
                This is a reminder about your upcoming medical appointment.
                Please review the details below.
              </p>

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;">
                
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;">
                      Doctor / Hospital
                    </p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;font-weight:500;">
                      ${doctor || "Not specified"}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;">
                      Date & Time
                    </p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;font-weight:500;">
                      ${appointmentDate.toLocaleString()}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;">
                      Starts
                    </p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;font-weight:600;">
                      ${countdownText}
                    </p>
                  </td>
                </tr>

                ${
                  notes
                    ? `
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;">
                      Preparation Notes
                    </p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;line-height:1.6;">
                      ${notes}
                    </p>
                  </td>
                </tr>
                `
                    : ""
                }

              </table>

              <div style="height:1px;background:#e2e8f0;margin:32px 0;"></div>

              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                You're receiving this email because you scheduled a reminder in Medora.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Medora. All rights reserved.
              </p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#cbd5e1;">
                Automated medical reminder • Do not reply
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`,
    });

  } catch (error) {
    console.error("Email send failed:", error);
  }
};