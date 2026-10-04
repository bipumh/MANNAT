import "server-only";

/**
 * Returns the application origin used to build absolute links (e.g. invitation
 * URLs). Prefers `NEXT_PUBLIC_APP_URL`; falls back to Vercel's injected URL in
 * production, then localhost for development. Never hard-codes a deployment.
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/+$/, "");

  return "http://localhost:3000";
}
