import "server-only";

import { getDb } from "@/lib/db";
import type { ActivityEvent } from "@/types";

type ActivityEventRow = {
  id: string;
  workspace_id: string;
  actor_user_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
  actor_name: string | null;
};

function mapActivityEvent(row: ActivityEventRow): ActivityEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    actorUserId: row.actor_user_id ?? null,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id ?? null,
    title: row.title,
    description: row.description ?? null,
    createdAt: row.created_at,
    actorName: row.actor_name ?? null,
  };
}

/**
 * Lists a workspace's activity events, newest first, joined with the actor's
 * profile name, optionally filtered by entity type and capped by `limit`.
 */
export async function listActivityEvents(
  workspaceId: string,
  opts: { entityType?: string; limit?: number } = {},
): Promise<ActivityEvent[]> {
  const sql = getDb();
  const entityType = opts.entityType ?? null;
  const limit = opts.limit ?? 25;

  const rows = (await sql.query(
    `select
       ae.id, ae.workspace_id, ae.actor_user_id, ae.event_type, ae.entity_type,
       ae.entity_id, ae.title, ae.description, ae.created_at,
       p.full_name as actor_name
     from activity_events ae
     left join profiles p on p.id = ae.actor_user_id
     where ae.workspace_id = $1
       and ($2::text is null or ae.entity_type = $2)
     order by ae.created_at desc
     limit $3`,
    [workspaceId, entityType, limit],
  )) as ActivityEventRow[];

  return rows.map(mapActivityEvent);
}

/**
 * Shortcut for a small, recent slice of the workspace's activity.
 */
export async function getRecentActivity(
  workspaceId: string,
  limit = 10,
): Promise<ActivityEvent[]> {
  return listActivityEvents(workspaceId, { limit });
}
