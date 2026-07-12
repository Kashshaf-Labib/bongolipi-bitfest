import { Resend } from "resend";

// Sends a collaboration-invite email via Resend. Gracefully no-ops (returns
// { sent: false }) when email isn't configured, so inviting still works.
export async function sendCollabInviteEmail({
  to,
  inviterName,
  docTitle,
  docUrl,
}: {
  to: string;
  inviterName: string;
  docTitle: string;
  docUrl: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false };

  const from = process.env.EMAIL_FROM || "Bongolipi <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color:#c4562e;">You've been invited to collaborate</h2>
      <p><strong>${escapeHtml(inviterName)}</strong> invited you to edit
      "<strong>${escapeHtml(docTitle)}</strong>" on Bongolipi.</p>
      <p>
        <a href="${docUrl}" style="display:inline-block; background:#c4562e; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-weight:600;">
          Open the document
        </a>
      </p>
      <p style="color:#6b7280; font-size:13px;">
        Or paste this link into your browser:<br>${docUrl}
      </p>
      <p style="color:#6b7280; font-size:12px;">
        You can also find it under "Shared with me" in your dashboard.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `${inviterName} invited you to collaborate on "${docTitle}"`,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("Failed to send invite email:", error);
    return { sent: false };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
