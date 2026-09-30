import "server-only";

import { getDb } from "@/lib/db";
import { listAssignedProjects } from "@/lib/projects/members";
import { listAssignedTasks } from "@/lib/tasks/queries";
import { listWorkLogsByUser } from "@/lib/work-log/queries";
import { listTimeEntries } from "@/lib/time/queries";
import type { Project, Task, TimeEntry, WorkLog } from "@/types";

export type MyWorkData = {
  projects: Project[];
  tasks: Task[];
  workLogs: WorkLog[];
  timeEntries: TimeEntry[];
  trackedMinutes: number;
  billableMinutes: number;
};

async function getTimeTotals(
  workspaceId: string,
  userId: string,
): Promise<{ trackedMinutes: number; billableMinutes: number }> {
  const sql = getDb();
  const rows = (await sql.query(
    `select
       coalesce(sum(duration_minutes), 0)::int as tracked,
       coalesce(sum(duration_minutes) filter (where billable), 0)::int as billable
     from time_entries
     where workspace_id = $1 and user_id = $2`,
    [workspaceId, userId],
  )) as { tracked: number; billable: number }[];

  const row = rows[0];
  return {
    trackedMinutes: Number(row?.tracked ?? 0),
    billableMinutes: Number(row?.billable ?? 0),
  };
}

/**
 * Aggregates everything a single member needs for their "My Work" view, all
 * scoped to the authenticated user (server-side) and the workspace.
 */
export async function getMyWork(
  workspaceId: string,
  userId: string,
): Promise<MyWorkData> {
  const [projects, tasks, workLogs, timeEntries, timeTotals] = await Promise.all([
    listAssignedProjects(workspaceId, userId),
    listAssignedTasks(workspaceId, userId),
    listWorkLogsByUser(workspaceId, userId),
    listTimeEntries(workspaceId, { userId }),
    getTimeTotals(workspaceId, userId),
  ]);

  return {
    projects,
    tasks,
    workLogs,
    timeEntries,
    trackedMinutes: timeTotals.trackedMinutes,
    billableMinutes: timeTotals.billableMinutes,
  };
}
