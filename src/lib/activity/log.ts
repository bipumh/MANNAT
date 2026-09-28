import "server-only";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export type LogActivityParams = {
  workspaceId: string;
  actorUserId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Appends a single activity event. Best-effort: any failure is logged and
 * swallowed so it can never corrupt the business operation that triggered it.
 * Callers only invoke this after their mutation has already succeeded.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const sql = getDb();
  const metadata = params.metadata ? JSON.stringify(params.metadata) : null;
  try {
    await sql.query(
      `insert into activity_events (
         workspace_id, actor_user_id, event_type, entity_type, entity_id,
         title, description, metadata
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        params.workspaceId,
        params.actorUserId,
        params.eventType,
        params.entityType,
        params.entityId ?? null,
        params.title,
        params.description ?? null,
        metadata,
      ],
    );
    revalidatePath("/dashboard/activity");
  } catch (err) {
    console.error("[mannat] log activity failed:", err);
  }
}
