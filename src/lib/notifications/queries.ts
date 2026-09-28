import "server-only";

import { getDb } from "@/lib/db";
import type { Notification } from "@/types";

type NotificationRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message ?? null,
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

/**
 * Lists the current user's notifications within their workspace, newest first.
 */
export async function listNotifications(
  workspaceId: string,
  userId: string,
  opts: { unreadOnly?: boolean; limit?: number } = {},
): Promise<Notification[]> {
  const sql = getDb();
  const unreadOnly = opts.unreadOnly ?? false;
  const limit = opts.limit ?? 15;

  const rows = (await sql.query(
    `select id, workspace_id, user_id, type, title, message, entity_type, entity_id, read_at, created_at
     from notifications
     where workspace_id = $1 and user_id = $2
       and ($3::boolean = false or read_at is null)
     order by created_at desc
     limit $4`,
    [workspaceId, userId, unreadOnly, limit],
  )) as NotificationRow[];

  return rows.map(mapNotification);
}

/**
 * Counts the current user's unread notifications in their workspace.
 */
export async function getUnreadNotificationCount(
  workspaceId: string,
  userId: string,
): Promise<number> {
  const sql = getDb();
  const rows = await sql`
    select count(*)::int as count
    from notifications
    where workspace_id = ${workspaceId} and user_id = ${userId} and read_at is null
  `;
  return Number(rows[0]?.count ?? 0);
}
