import "server-only";

import { getDb } from "@/lib/db";
import { toDateOnlyString } from "@/lib/format";
import type { Project, WorkspaceMember } from "@/types";

/**
 * Lists the workspace members assigned to a project, joined with their profile
 * and Neon Auth email. Scoped to the workspace.
 */
export async function listProjectMembers(
  workspaceId: string,
  projectId: string,
): Promise<WorkspaceMember[]> {
  const sql = getDb();
  const rows = (await sql.query(
    `select
       wm.id, wm.workspace_id, wm.user_id, wm.role, wm.created_at,
       p.full_name,
       u.email
     from project_members pm
     join workspace_members wm
       on wm.workspace_id = pm.workspace_id and wm.user_id = pm.user_id
     join profiles p on p.id = wm.user_id
     left join neon_auth.user u on u.id::text = wm.user_id
     where pm.workspace_id = $1 and pm.project_id = $2
     order by
       case wm.role when 'owner' then 0 when 'admin' then 1 else 2 end,
       wm.created_at asc`,
    [workspaceId, projectId],
  )) as {
    id: string;
    workspace_id: string;
    user_id: string;
    role: WorkspaceMember["role"];
    created_at: string;
    full_name: string;
    email: string | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    fullName: row.full_name,
    email: row.email ?? null,
  }));
}

/**
 * Lists the active projects a given member has assignment-based access to
 * (project membership or an assigned task), used by My Work. Scoped to the
 * workspace.
 */
export async function listAssignedProjects(
  workspaceId: string,
  userId: string,
): Promise<Project[]> {
  const sql = getDb();
  const rows = (await sql.query(
    `select
       p.id, p.workspace_id, p.client_id, p.name, p.description, p.status, p.priority,
       p.start_date, p.due_date, p.budget, p.archived, p.created_at, p.updated_at,
       c.name as client_name, c.company as client_company
     from projects p
     join clients c on c.id = p.client_id
     where p.workspace_id = $1 and p.archived = false
       and (
         exists (
           select 1 from project_members pm
           where pm.project_id = p.id and pm.user_id = $2
         )
         or exists (
           select 1 from tasks t
           where t.project_id = p.id and t.assignee_user_id = $2
         )
       )
     order by p.created_at desc`,
    [workspaceId, userId],
  )) as {
    id: string;
    workspace_id: string;
    client_id: string;
    name: string;
    description: string | null;
    status: Project["status"];
    priority: Project["priority"];
    start_date: string | null;
    due_date: string | null;
    budget: string | null;
    archived: boolean;
    created_at: string;
    updated_at: string;
    client_name: string | null;
    client_company: string | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    startDate: toDateOnlyString(row.start_date),
    dueDate: toDateOnlyString(row.due_date),
    budget: row.budget,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client_name,
    clientCompany: row.client_company,
  }));
}
