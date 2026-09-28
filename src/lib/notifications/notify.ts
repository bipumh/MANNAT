import "server-only";

import { getDb } from "@/lib/db";

/**
 * Creates a notification for a single user. Best-effort: failures are logged
 * and swallowed so notification delivery can never break a business mutation.
 */
export async function notifyUser(params: {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}): Promise<void> {
  const sql = getDb();
  try {
    await sql`
      insert into notifications (
        workspace_id, user_id, type, title, message, entity_type, entity_id
      )
      values (
        ${params.workspaceId},
        ${params.userId},
        ${params.type},
        ${params.title},
        ${params.message ?? null},
        ${params.entityType ?? null},
        ${params.entityId ?? null}
      )
    `;
  } catch (err) {
    console.error("[mannat] notify user failed:", err);
  }
}

const PREFERENCE_COLUMNS: Record<string, string> = {
  member_updates: "member_updates",
  invoice_updates: "invoice_updates",
};

/**
 * Creates a notification for every owner/admin in the workspace (excluding an
 * optional user, e.g. the actor). Single insert-select — no per-recipient loop.
 *
 * When `preferenceKey` is provided (a whitelisted `notification_preferences`
 * column), recipients who have opted out of that category are skipped.
 */
export async function notifyOwnersAndAdmins(params: {
  workspaceId: string;
  type: string;
  title: string;
  message?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  excludeUserId?: string | null;
  preferenceKey?: string | null;
}): Promise<void> {
  const sql = getDb();
  const prefColumn = params.preferenceKey
    ? PREFERENCE_COLUMNS[params.preferenceKey]
    : undefined;
  try {
    if (prefColumn) {
      await sql.query(
        `insert into notifications (
           workspace_id, user_id, type, title, message, entity_type, entity_id
         )
         select $1, wm.user_id, $2, $3, $4, $5, $6
         from workspace_members wm
         left join notification_preferences np
           on np.workspace_id = wm.workspace_id and np.user_id = wm.user_id
         where wm.workspace_id = $1
           and wm.role in ('owner', 'admin')
           and ($7::text is null or wm.user_id <> $7)
           and coalesce(np.${prefColumn}, true)`,
        [
          params.workspaceId,
          params.type,
          params.title,
          params.message ?? null,
          params.entityType ?? null,
          params.entityId ?? null,
          params.excludeUserId ?? null,
        ],
      );
      return;
    }

    await sql`
      insert into notifications (
        workspace_id, user_id, type, title, message, entity_type, entity_id
      )
      select
        ${params.workspaceId},
        wm.user_id,
        ${params.type},
        ${params.title},
        ${params.message ?? null},
        ${params.entityType ?? null},
        ${params.entityId ?? null}
      from workspace_members wm
      where wm.workspace_id = ${params.workspaceId}
        and wm.role in ('owner', 'admin')
        and (${params.excludeUserId ?? null}::text is null
             or wm.user_id <> ${params.excludeUserId ?? null})
    `;
  } catch (err) {
    console.error("[mannat] notify owners/admins failed:", err);
  }
}
