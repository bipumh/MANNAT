import "server-only";

import { getDb } from "@/lib/db";
import type { NotificationPreferences } from "@/types";

export type ProfileSettings = {
  fullName: string;
  avatarUrl: string | null;
};

export type WorkspaceSettings = {
  id: string;
  name: string;
  createdAt: string;
};

export async function getProfileSettings(
  userId: string,
): Promise<ProfileSettings | null> {
  const sql = getDb();
  const rows = await sql`
    select full_name, avatar_url
    from profiles
    where id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    fullName: row.full_name ?? "",
    avatarUrl: row.avatar_url ?? null,
  };
}

export async function getWorkspaceSettings(
  workspaceId: string,
): Promise<WorkspaceSettings | null> {
  const sql = getDb();
  const rows = await sql`
    select id, name, created_at
    from workspaces
    where id = ${workspaceId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getNotificationPreferences(
  workspaceId: string,
  userId: string,
): Promise<NotificationPreferences> {
  const sql = getDb();
  const rows = await sql`
    select member_updates, invoice_updates
    from notification_preferences
    where workspace_id = ${workspaceId} and user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  return {
    memberUpdates: row?.member_updates ?? true,
    invoiceUpdates: row?.invoice_updates ?? true,
  };
}
