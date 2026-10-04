import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/server";
import {
  NEON_AUTH_SESSION_DATA_COOKIE_NAME,
  validateSessionData,
} from "@neondatabase/auth/server";
import { getDb } from "@/lib/db";
import type { SessionUser, WorkspaceRole } from "@/types";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Reads the current Neon Auth session without mutating cookies.
 *
 * `auth.getSession()` performs a cookie write whenever the signed session-data
 * cache cookie is absent (it mints a new one from the upstream session), which
 * Next.js forbids during ordinary Server Component rendering ("Cookies can only
 * be modified in a Server Action or Route Handler"). Instead we read that signed
 * cookie directly (read-only) and validate it with the cookie secret. When the
 * cookie is missing/invalid we fall back to `auth.getSession()` and treat a
 * cookie-write error as "no session".
 */
async function readSession(): Promise<{ user: unknown } | null> {
  try {
    const cookieStore = await cookies();
    const sessionData = cookieStore.get(
      NEON_AUTH_SESSION_DATA_COOKIE_NAME,
    )?.value;
    if (sessionData) {
      const result = await validateSessionData(
        sessionData,
        process.env.NEON_AUTH_COOKIE_SECRET!,
      );
      if (result.valid && result.payload) {
        return result.payload;
      }
    }
  } catch (err) {
    console.error("[mannat] read session cookie failed:", err);
  }

  try {
    const { data } = await auth.getSession();
    return data ?? null;
  } catch (err) {
    console.error("[mannat] getSession failed:", err);
    return null;
  }
}

/**
 * Resolves the authenticated Neon Auth user plus their profile and active
 * workspace, or `null` when there is no session.
 *
 * Wrapped in React `cache` so the dashboard layout and page share a single
 * result within the same request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  const user = session?.user as
    | { id: string; email?: string | null; name?: string | null }
    | undefined;
  if (!user?.id) return null;

  const sql = getDb();

  const [profileRows, membershipRows] = await Promise.all([
    sql`select full_name, active_workspace_id from profiles where id = ${user.id}`,
    sql`
      select workspace_id, role
      from workspace_members
      where user_id = ${user.id}
      order by created_at asc
    `,
  ]);
  const profile = profileRows[0] ?? null;
  const memberships = membershipRows;

  // Resolve the active workspace: prefer the persisted selection when the user
  // is still a member of it, otherwise fall back to the oldest membership.
  // Single-workspace users (most owners/admins) resolve to their one workspace.
  let membership = memberships[0] ?? null;
  if (profile?.active_workspace_id) {
    const active = memberships.find(
      (m) => m.workspace_id === profile.active_workspace_id,
    );
    if (active) membership = active;
  }

  let workspaceName = "My workspace";
  if (membership) {
    const workspaceRows = await sql`select name from workspaces where id = ${membership.workspace_id}`;
    const workspace = workspaceRows[0] ?? null;
    if (workspace) workspaceName = workspace.name;
  }

  const email = user.email ?? "";
  const fullName =
    profile?.full_name?.trim() ||
    user.name?.trim() ||
    email.split("@")[0] ||
    "User";

  return {
    id: user.id,
    email,
    fullName,
    initials: getInitials(fullName),
    workspaceId: membership?.workspace_id ?? "",
    workspaceName,
    role: (membership?.role as WorkspaceRole) ?? "member",
  };
});
