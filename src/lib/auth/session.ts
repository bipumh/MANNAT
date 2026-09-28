import "server-only";

import { cache } from "react";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import type { SessionUser, WorkspaceRole } from "@/types";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Resolves the authenticated Neon Auth user plus their profile and primary
 * workspace, or `null` when there is no session.
 *
 * Wrapped in React `cache` so the dashboard layout and page share a single
 * result within the same request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) return null;

  const sql = getDb();

  const [profileRows, membershipRows] = await Promise.all([
    sql`select full_name from profiles where id = ${user.id}`,
    sql`
      select workspace_id, role
      from workspace_members
      where user_id = ${user.id}
      order by created_at asc
      limit 1
    `,
  ]);
  const profile = profileRows[0] ?? null;
  const membership = membershipRows[0] ?? null;

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
