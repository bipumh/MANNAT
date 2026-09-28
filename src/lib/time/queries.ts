import "server-only";

import { getDb } from "@/lib/db";
import type { TimeEntry } from "@/types";

type TimeEntryRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  task_id: string | null;
  description: string | null;
  date: string;
  duration_minutes: number;
  billable: boolean;
  hourly_rate: string | null;
  created_at: string;
  updated_at: string;
  project_name: string | null;
  task_title: string | null;
  client_id: string | null;
  client_name: string | null;
  client_company: string | null;
};

function mapTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    taskId: row.task_id ?? null,
    description: row.description ?? null,
    date: row.date,
    durationMinutes: row.duration_minutes,
    billable: row.billable,
    hourlyRate: row.hourly_rate ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectName: row.project_name ?? null,
    taskTitle: row.task_title ?? null,
    clientId: row.client_id ?? null,
    clientName: row.client_name ?? null,
    clientCompany: row.client_company ?? null,
  };
}

const TIME_ENTRY_COLUMNS = `
  t.id, t.workspace_id, t.project_id, t.task_id, t.description, t.date,
  t.duration_minutes, t.billable, t.hourly_rate, t.created_at, t.updated_at,
  p.name as project_name,
  tk.title as task_title,
  c.id as client_id, c.name as client_name, c.company as client_company
`;

/**
 * Lists the workspace's time entries, joined with project / task / client,
 * optionally filtered by project, task, billable flag and a case-insensitive
 * search across description, project name, task title and client name.
 */
export async function listTimeEntries(
  workspaceId: string,
  opts: {
    q?: string;
    projectId?: string;
    taskId?: string;
    billable?: boolean;
  } = {},
): Promise<TimeEntry[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const projectId = opts.projectId ?? null;
  const taskId = opts.taskId ?? null;
  const billable = opts.billable === undefined ? null : opts.billable;

  const rows = (await sql.query(
    `select ${TIME_ENTRY_COLUMNS}
     from time_entries t
     join projects p on p.id = t.project_id
     join clients c on c.id = p.client_id
     left join tasks tk on tk.id = t.task_id
     where t.workspace_id = $1
       and ($2::text is null or t.project_id = $2)
       and ($3::text is null or t.task_id = $3)
       and ($4::boolean is null or t.billable = $4)
       and ($5::text is null
            or t.description ilike $5
            or p.name ilike $5
            or tk.title ilike $5
            or c.name ilike $5)
     order by t.date desc, t.created_at desc`,
    [workspaceId, projectId, taskId, billable, term],
  )) as TimeEntryRow[];

  return rows.map(mapTimeEntry);
}

/**
 * Returns a single time entry (joined with project, task and client) scoped to
 * the workspace, or `null` when it does not exist or belongs to another
 * workspace.
 */
export async function getTimeEntry(
  workspaceId: string,
  timeEntryId: string,
): Promise<TimeEntry | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${TIME_ENTRY_COLUMNS}
     from time_entries t
     join projects p on p.id = t.project_id
     join clients c on c.id = p.client_id
     left join tasks tk on tk.id = t.task_id
     where t.workspace_id = $1 and t.id = $2
     limit 1`,
    [workspaceId, timeEntryId],
  )) as TimeEntryRow[];

  return rows[0] ? mapTimeEntry(rows[0]) : null;
}
