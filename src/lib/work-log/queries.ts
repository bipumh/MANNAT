import "server-only";

import { getDb } from "@/lib/db";
import { toDateOnlyString } from "@/lib/format";
import type { WorkLog } from "@/types";

type WorkLogRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  work_date: string;
  description: string;
  duration_minutes: number;
  billable: boolean;
  rate: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  client_name: string | null;
  project_name: string | null;
  task_title: string | null;
};

function mapWorkLog(row: WorkLogRow): WorkLog {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clientId: row.client_id,
    projectId: row.project_id,
    taskId: row.task_id ?? null,
    userId: row.user_id,
    workDate: toDateOnlyString(row.work_date) ?? "",
    description: row.description,
    durationMinutes: row.duration_minutes,
    billable: row.billable,
    rate: row.rate ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name ?? null,
    clientName: row.client_name ?? null,
    projectName: row.project_name ?? null,
    taskTitle: row.task_title ?? null,
  };
}

const WORK_LOG_SELECT = `
  wl.id, wl.workspace_id, wl.client_id, wl.project_id, wl.task_id, wl.user_id,
  wl.work_date, wl.description, wl.duration_minutes, wl.billable, wl.rate,
  wl.notes, wl.created_at, wl.updated_at,
  p.full_name as user_name,
  c.name as client_name,
  pr.name as project_name,
  tk.title as task_title
`;

const WORK_LOG_FROM = `
  from work_logs wl
  join clients c on c.id = wl.client_id
  join projects pr on pr.id = wl.project_id
  left join tasks tk on tk.id = wl.task_id
  left join profiles p on p.id = wl.user_id
`;

type WorkLogFilter = { clientId?: string; projectId?: string; userId?: string };

/**
 * Lists work-log records scoped to the workspace, optionally filtered by
 * client, project and/or the member who performed the work, newest first.
 */
export async function listWorkLogs(
  workspaceId: string,
  filter: WorkLogFilter = {},
): Promise<WorkLog[]> {
  const sql = getDb();
  const clientId = filter.clientId ?? null;
  const projectId = filter.projectId ?? null;
  const userId = filter.userId ?? null;

  const rows = (await sql.query(
    `select ${WORK_LOG_SELECT}
     ${WORK_LOG_FROM}
     where wl.workspace_id = $1
       and ($2::text is null or wl.client_id = $2::uuid)
       and ($3::text is null or wl.project_id = $3::uuid)
       and ($4::text is null or wl.user_id = $4)
     order by wl.work_date desc, wl.created_at desc`,
    [workspaceId, clientId, projectId, userId],
  )) as WorkLogRow[];

  return rows.map(mapWorkLog);
}

export async function listWorkLogsByClient(
  workspaceId: string,
  clientId: string,
): Promise<WorkLog[]> {
  return listWorkLogs(workspaceId, { clientId });
}

export async function listWorkLogsByProject(
  workspaceId: string,
  projectId: string,
): Promise<WorkLog[]> {
  return listWorkLogs(workspaceId, { projectId });
}

export async function listWorkLogsByUser(
  workspaceId: string,
  userId: string,
): Promise<WorkLog[]> {
  return listWorkLogs(workspaceId, { userId });
}
