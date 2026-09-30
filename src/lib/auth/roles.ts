import "server-only";

import type { SessionUser } from "@/types";

/**
 * Whether the authenticated user may manage workspace records (invite members,
 * assign projects/tasks, review team work). Owners and admins can manage;
 * regular members cannot.
 */
export function canManage(user: SessionUser): boolean {
  return user.role === "owner" || user.role === "admin";
}
