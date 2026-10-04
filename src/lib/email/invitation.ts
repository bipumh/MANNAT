import "server-only";

import { hasEmailConfig, sendEmail } from "@/lib/email/send";
import { getAppUrl } from "@/lib/email/app-url";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "soon";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export type InvitationEmailParams = {
  to: string;
  inviterName: string;
  workspaceName: string;
  token: string;
  expiresAt: string;
};

/**
 * Builds and (when Resend is configured) sends the MANNAT team invitation
 * email (HTML + plain-text). Always returns the absolute invitation URL so the
 * caller can surface it in the UI regardless of whether email was delivered.
 *
 * When `RESEND_API_KEY` / `RESEND_FROM` are not configured, email is skipped
 * (`sent: false`) — the invitation link still works and can be shared manually.
 */
export async function sendInvitationEmail(
  params: InvitationEmailParams,
): Promise<{ sent: boolean; inviteUrl: string }> {
  const inviteUrl = `${getAppUrl()}/invite/${params.token}`;

  if (!hasEmailConfig()) {
    return { sent: false, inviteUrl };
  }

  const inviter = escapeHtml(params.inviterName);
  const workspace = escapeHtml(params.workspaceName);
  const link = escapeHtml(inviteUrl);
  const expiry = formatExpiry(params.expiresAt);

  const subject = "You've been invited to join MANNAT";

  const text = [
    "You've been invited to join MANNAT",
    "",
    `${params.inviterName} has invited you to join ${params.workspaceName} on MANNAT.`,
    "",
    `Accept your invitation: ${inviteUrl}`,
    "",
    "You can then use MANNAT to manage your assigned clients, projects, tasks, work logs, and time.",
    "",
    `This invitation link expires ${expiry}. If it has expired, ask the workspace owner or admin to send a new one.`,
  ].join("\n");

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
  </head>
  <body style="margin:0;padding:0;background-color:#0b0f0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f0d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
            <tr>
              <td style="padding:40px 40px 32px;background-color:#151b18;border:1px solid #26332d;border-radius:16px;">
                <p style="margin:0 0 24px;font-size:18px;font-weight:700;letter-spacing:0.06em;color:#2dd4a8;text-transform:uppercase;">MANNAT</p>

                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#f3f7f5;">You've been invited to join MANNAT</h1>

                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#9ba8a2;">
                  <span style="color:#f3f7f5;font-weight:600;">${inviter}</span> has invited you to join <span style="color:#f3f7f5;font-weight:600;">${workspace}</span> on MANNAT.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td align="left">
                      <a href="${link}" style="display:inline-block;padding:13px 24px;background-color:#2dd4a8;color:#05251c;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">Accept invitation</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#9ba8a2;">
                  You can then use MANNAT to manage your assigned clients, projects, tasks, work logs, and time.
                </p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#56615b;">
                  This invitation link expires ${expiry}. If it has expired, ask the workspace owner or admin to send a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 0 0;font-size:12px;color:#56615b;">
                MANNAT — run your entire business from one place.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  await sendEmail({ to: params.to, subject, html, text });
  return { sent: true, inviteUrl };
}
