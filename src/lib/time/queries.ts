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
  user_id: string | null;
  user_name: string | null;
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
    userId: row.user_id ?? null,
    userName: row.user_name ?? null,
  };
}

const TIME_ENTRY_SELECT = `
  t.id, t.workspace_id, t.project_id, t.task_id, t.description, t.date,
  t.duration_minutes, t.billable, t.hourly_rate, t.created_at, t.updated_at,
  p.name as project_name,
  tk.title as task_title,
  c.id as client_id, c.name as client_name, c.company as client_company,
  t.user_id,
  up.full_name as user_name
`;

const TIME_ENTRY_FROM = `
  from time_entries t
  join projects p on p.id = t.project_id
  join clients c on c.id = p.client_id
  left join tasks tk on tk.id = t.task_id
  left join profiles up on up.id = t.user_id
`;

/**
 * Lists the workspace's time entries, joined with project / task / client /
 * owner, optionally filtered by project, task, billable flag, owner and a
 * case-insensitive search across description, project name, task title and
 * client name.
 */
export async function listTimeEntries(
  workspaceId: string,
  opts: {
    q?: string;
    projectId?: string;
    taskId?: string;
    billable?: boolean;
    userId?: string;
  } = {},
): Promise<TimeEntry[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const projectId = opts.projectId ?? null;
  const taskId = opts.taskId ?? null;
  const billable = opts.billable === undefined ? null : opts.billable;
  const userId = opts.userId ?? null;

  const rows = (await sql.query(
    `select ${TIME_ENTRY_SELECT}
     ${TIME_ENTRY_FROM}
     where t.workspace_id = $1
       and ($2::text is null or t.project_id = $2::uuid)
       and ($3::text is null or t.task_id = $3::uuid)
       and ($4::boolean is null or t.billable = $4)
       and ($5::text is null or t.user_id = $5)
       and ($6::text is null
            or t.description ilike $6
            or p.name ilike $6
            or tk.title ilike $6
            or c.name ilike $6)
     order by t.date desc, t.created_at desc`,
    [workspaceId, projectId, taskId, billable, userId, term],
  )) as TimeEntryRow[];

  return rows.map(mapTimeEntry);
}

/**
 * Returns a single time entry (joined with project, task, client and owner)
 * scoped to the workspace, or `null` when it does not exist or belongs to
 * another workspace.
 */
export async function getTimeEntry(
  workspaceId: string,
  timeEntryId: string,
): Promise<TimeEntry | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${TIME_ENTRY_SELECT}
     ${TIME_ENTRY_FROM}
     where t.workspace_id = $1 and t.id = $2
     limit 1`,
    [workspaceId, timeEntryId],
  )) as TimeEntryRow[];

  return rows[0] ? mapTimeEntry(rows[0]) : null;
}

export type UnbilledProjectSummary = {
  projectId: string;
  projectName: string;
  clientName: string | null;
  entryCount: number;
  totalMinutes: number;
  totalValue: number;
};

/**
 * Summarises unbilled, billable time (with a rate) grouped by project, so the
 * UI can offer a "convert time → invoice" action. Excludes anything already
 * referenced by an invoice line item.
 */
export async function getUnbilledTimeSummary(
  workspaceId: string,
): Promise<UnbilledProjectSummary[]> {
  const sql = getDb();

  const rows = (await sql.query(
    `select
       p.id as project_id,
       p.name as project_name,
       c.name as client_name,
       count(t.id)::int as entry_count,
       coalesce(sum(t.duration_minutes), 0)::int as total_minutes,
       coalesce(sum(t.duration_minutes::float8 / 60 * t.hourly_rate), 0)::float8 as total_value
     from time_entries t
     join projects p on p.id = t.project_id
     join clients c on c.id = p.client_id
     where t.workspace_id = $1
       and t.billable = true
       and t.hourly_rate is not null
       and not exists (
         select 1 from invoice_items ii where ii.time_entry_id = t.id
       )
     group by p.id, p.name, c.name
     order by total_value desc`,
    [workspaceId],
  )) as {
    project_id: string;
    project_name: string;
    client_name: string | null;
    entry_count: number;
    total_minutes: number;
    total_value: number;
  }[];

  return rows.map((row) => ({
    projectId: row.project_id,
    projectName: row.project_name,
    clientName: row.client_name ?? null,
    entryCount: Number(row.entry_count),
    totalMinutes: Number(row.total_minutes),
    totalValue: Number(row.total_value),
  }));
}
