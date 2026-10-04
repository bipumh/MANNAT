import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Whether email delivery is configured. Resend is optional: invitations work
 * without it (the shareable link is still created). Returns true only when both
 * `RESEND_API_KEY` and `RESEND_FROM` are present.
 */
export function hasEmailConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends a transactional email via Resend's HTTP API. No SDK dependency — a
 * single authenticated POST. `RESEND_API_KEY` and `RESEND_FROM` (a verified
 * sender address/domain) are read from the environment and never hard-coded.
 *
 * Throws on failure so the caller can decide how to degrade (the invitation
 * record must still be created even if delivery fails).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error("RESEND_FROM is not set.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}
