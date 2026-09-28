import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Lazily-created Neon serverless Postgres client (HTTP driver).
 *
 * Server-only: used from Server Components and Server Actions. The connection
 * string (`DATABASE_URL`) is never exposed to the browser.
 */
export function getDb(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    client = neon<false, false>(url);
  }
  return client;
}
