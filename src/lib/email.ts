import { Resend } from "resend";

// Inert without RESEND_API_KEY — logs the email instead of sending it, so
// password-reset/verification links stay usable in local dev (read the link
// from the server console) even before a real key is configured.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || "Rijklaar <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email:disabled] to=${to} subject="${subject}"\n${html}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}
