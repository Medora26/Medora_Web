import { resend } from "./client";

export const sendReminderEmail = async ({
  to,
  title,
  doctor,
  appointmentDate,
}: {
  to: string;
  title: string;
  doctor?: string;
  appointmentDate: Date;
}) => {
  try {
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
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
            <tr>
              <td align="center">

                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;text-align:center;color:#ffffff;">
                      <h1 style="margin:0;font-size:24px;">Medora</h1>
                      <p style="margin:4px 0 0;font-size:14px;opacity:0.9;">Your Personal Medical Assistant</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:32px;">

                      <h2 style="margin-top:0;color:#111827;">Appointment Reminder</h2>

                      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
                        This is a reminder for your upcoming medical appointment.
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                        <tr>
                          <td style="padding:16px;background:#f9fafb;">
                            <strong>Appointment:</strong><br/>
                            ${title}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px;border-top:1px solid #e5e7eb;">
                            <strong>Doctor / Hospital:</strong><br/>
                            ${doctor || "Not specified"}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px;border-top:1px solid #e5e7eb;">
                            <strong>Date & Time:</strong><br/>
                            ${appointmentDate.toLocaleString()}
                          </td>
                        </tr>
                      </table>

                      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
                        Please ensure you arrive 10–15 minutes early and carry relevant medical reports.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;">
                      © ${new Date().getFullYear()} Medora. All rights reserved.
                      <br/>
                      This is an automated reminder email.
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