import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Server-side Neon Auth (Managed Better Auth) instance.
 *
 * Imported only by server code (Server Components, Server Actions, Route
 * Handlers, and `src/proxy.ts`). Exposes Better Auth server methods
 * (`signIn.email`, `signUp.email`, `signOut`, `getSession`), plus `.handler()`
 * and `.middleware()`.
 *
 * `NEON_AUTH_BASE_URL` is injected by Neon (`neon env pull` / `neon deploy`).
 * `NEON_AUTH_COOKIE_SECRET` is a local app secret (see `.env.example`).
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
