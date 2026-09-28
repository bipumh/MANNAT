import "server-only";

import { getDb } from "@/lib/db";
import type { Task, TaskPriority, TaskStatus } from "@/types";

type TaskRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  project_name: string | null;
  client_id: string | null;
  client_name: string | null;
  client_company: string | null;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectName: row.project_name ?? null,
    clientId: row.client_id ?? null,
    clientName: row.client_name ?? null,
    clientCompany: row.client_company ?? null,
  };
}

/**
 * Lists the workspace's active (non-archived) tasks, joined with their project,
 * optionally filtered by status / priority / project and a case-insensitive
 * search across title, description and project name.
 */
export async function listTasks(
  workspaceId: string,
  opts: {
    q?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
  } = {},
): Promise<Task[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const status = opts.status ?? null;
  const priority = opts.priority ?? null;
  const projectId = opts.projectId ?? null;

  const rows = (await sql.query(
    `select
       t.id, t.workspace_id, t.project_id, t.title, t.description, t.status, t.priority,
       t.due_date, t.completed_at, t.archived, t.created_at, t.updated_at,
       p.name as project_name
     from tasks t
     join projects p on p.id = t.project_id
     where t.workspace_id = $1
       and t.archived = false
       and ($2::text is null or t.status = $2)
       and ($3::text is null or t.priority = $3)
       and ($4::text is null or t.project_id = $4)
       and ($5::text is null
            or t.title ilike $5
            or t.description ilike $5
            or p.name ilike $5)
     order by t.created_at desc`,
    [workspaceId, status, priority, projectId, term],
  )) as TaskRow[];

  return rows.map(mapTask);
}

/**
 * Returns a single task (joined with its project and client) scoped to the
 * workspace, or `null` when it does not exist or belongs to another workspace.
 */
export async function getTask(
  workspaceId: string,
  taskId: string,
): Promise<Task | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select
       t.id, t.workspace_id, t.project_id, t.title, t.description, t.status, t.priority,
       t.due_date, t.completed_at, t.archived, t.created_at, t.updated_at,
       p.name as project_name,
       c.id as client_id, c.name as client_name, c.company as client_company
     from tasks t
     join projects p on p.id = t.project_id
     join clients c on c.id = p.client_id
     where t.workspace_id = $1 and t.id = $2
     limit 1`,
    [workspaceId, taskId],
  )) as TaskRow[];

  return rows[0] ? mapTask(rows[0]) : null;
}
