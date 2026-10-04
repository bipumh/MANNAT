import "server-only";

import { getDb } from "@/lib/db";

/**
 * Whether the given member is the assignee of a task in the workspace. Used to
 * allow members to update/complete only the tasks assigned to them.
 */
export async function isMemberAssigneeOfTask(
  workspaceId: string,
  userId: string,
  taskId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    select 1 from tasks
    where workspace_id = ${workspaceId} and id = ${taskId} and assignee_user_id = ${userId}
    limit 1
  `;
  return rows.length > 0;
}

/**
 * Whether the given user has assignment-based access to a project: either via
 * the `project_members` relationship or by being assigned a task on it. The
 * project must belong to the specified workspace. Used to restrict members to
 * recording work/time only on projects they're actually assigned to (directly
 * or through an assigned task).
 */
export async function isMemberAssignedToProject(
  workspaceId: string,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    select 1
    from projects p
    where p.workspace_id = ${workspaceId}
      and p.id = ${projectId}
      and (
        exists (
          select 1 from project_members pm
          where pm.project_id = p.id and pm.user_id = ${userId}
        )
        or exists (
          select 1 from tasks t
          where t.project_id = p.id and t.assignee_user_id = ${userId}
        )
      )
    limit 1
  `;
  return rows.length > 0;
}

/**
 * Whether the given user may reference a task: they are its assignee, or they
 * are assigned to the task's project via `project_members`. The task must belong
 * to the specified workspace. Used to restrict members to referencing only tasks
 * they can actually act on.
 */
export async function isMemberAssignedToTask(
  workspaceId: string,
  userId: string,
  taskId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    select 1
    from tasks t
    where t.workspace_id = ${workspaceId}
      and t.id = ${taskId}
      and (
        t.assignee_user_id = ${userId}
        or exists (
          select 1 from project_members pm
          where pm.project_id = t.project_id and pm.user_id = ${userId}
        )
      )
    limit 1
  `;
  return rows.length > 0;
}
