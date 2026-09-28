import "server-only";

import { getDb } from "@/lib/db";
import type { Project, ProjectPriority, ProjectStatus } from "@/types";

type ProjectRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  budget: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  client_name: string | null;
  client_company: string | null;
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    startDate: row.start_date,
    dueDate: row.due_date,
    budget: row.budget,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client_name,
    clientCompany: row.client_company,
  };
}

const PROJECT_COLUMNS = `
  p.id, p.workspace_id, p.client_id, p.name, p.description, p.status, p.priority,
  p.start_date, p.due_date, p.budget, p.archived, p.created_at, p.updated_at,
  c.name as client_name, c.company as client_company
`;

/**
 * Lists the workspace's active (non-archived) projects, joined with their
 * client, optionally filtered by status / priority and a case-insensitive
 * search across project name/description and client name/company.
 */
export async function listProjects(
  workspaceId: string,
  opts: {
    q?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
  } = {},
): Promise<Project[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const status = opts.status ?? null;
  const priority = opts.priority ?? null;

  const rows = (await sql.query(
    `select ${PROJECT_COLUMNS}
     from projects p
     join clients c on c.id = p.client_id
     where p.workspace_id = $1
       and p.archived = false
       and ($2::text is null or p.status = $2)
       and ($3::text is null or p.priority = $3)
       and ($4::text is null
            or p.name ilike $4
            or p.description ilike $4
            or c.name ilike $4
            or c.company ilike $4)
     order by p.created_at desc`,
    [workspaceId, status, priority, term],
  )) as ProjectRow[];

  return rows.map(mapProject);
}

/**
 * Returns a single project (joined with its client) scoped to the workspace, or
 * `null` when it does not exist or belongs to another workspace.
 */
export async function getProject(
  workspaceId: string,
  projectId: string,
): Promise<Project | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${PROJECT_COLUMNS}
     from projects p
     join clients c on c.id = p.client_id
     where p.workspace_id = $1 and p.id = $2
     limit 1`,
    [workspaceId, projectId],
  )) as ProjectRow[];

  return rows[0] ? mapProject(rows[0]) : null;
}
