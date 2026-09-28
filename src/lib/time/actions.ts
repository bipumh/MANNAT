"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import { formatDuration } from "@/lib/format";

export type TimeEntryFormState = {
  error?: string;
  success?: boolean;
};

export type TimeEntryInput = {
  projectId: string;
  taskId: string;
  description: string;
  date: string;
  durationMinutes: number;
  billable: boolean;
  hourlyRate: string;
};

function emptyToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rateToDb(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

function validate(input: TimeEntryInput): string | null {
  if (!input.projectId) return "Select a project for this entry.";

  const duration = Number(input.durationMinutes);
  if (!Number.isInteger(duration) || duration <= 0) {
    return "Duration must be a positive whole number of minutes.";
  }

  if (!input.date || Number.isNaN(Date.parse(input.date))) {
    return "Date is invalid.";
  }

  if (input.hourlyRate.trim()) {
    const rate = Number(input.hourlyRate);
    if (!Number.isFinite(rate) || rate < 0) {
      return "Hourly rate must be a non-negative number.";
    }
  }

  return null;
}

async function projectExistsInWorkspace(
  workspaceId: string,
  projectId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`select id from projects where id = ${projectId} and workspace_id = ${workspaceId}`;
  return rows.length > 0;
}

async function taskBelongsToProject(
  workspaceId: string,
  taskId: string,
  projectId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`select id from tasks where id = ${taskId} and workspace_id = ${workspaceId} and project_id = ${projectId}`;
  return rows.length > 0;
}

export async function createTimeEntryAction(
  input: TimeEntryInput,
): Promise<TimeEntryFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await projectExistsInWorkspace(user.workspaceId, input.projectId))) {
    return { error: "Selected project not found." };
  }
  if (
    input.taskId &&
    !(await taskBelongsToProject(user.workspaceId, input.taskId, input.projectId))
  ) {
    return { error: "Selected task not found." };
  }

  try {
    const sql = getDb();
    const rows = await sql`
      insert into time_entries (
        workspace_id, project_id, task_id, description, date,
        duration_minutes, billable, hourly_rate
      )
      values (
        ${user.workspaceId},
        ${input.projectId},
        ${emptyToNull(input.taskId)},
        ${emptyToNull(input.description)},
        ${input.date.trim() || todayISO()},
        ${input.durationMinutes},
        ${input.billable},
        ${rateToDb(input.hourlyRate)}
      )
      returning id
    `;
    const projectRows = await sql`
      select name
      from projects
      where id = ${input.projectId} and workspace_id = ${user.workspaceId}
      limit 1
    `;
    const projectName = projectRows[0]?.name ?? null;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "time.logged",
      entityType: "time",
      entityId: rows[0]?.id ?? null,
      title: "Time logged",
      description: `logged ${formatDuration(input.durationMinutes)}${
        projectName ? ` on "${projectName}"` : ""
      }`,
    });
  } catch (err) {
    console.error("[mannat] create time entry failed:", err);
    return { error: "Could not log the time entry. Please try again." };
  }

  revalidatePath("/dashboard/time");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTimeEntryAction(
  id: string,
  input: TimeEntryInput,
): Promise<TimeEntryFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await projectExistsInWorkspace(user.workspaceId, input.projectId))) {
    return { error: "Selected project not found." };
  }
  if (
    input.taskId &&
    !(await taskBelongsToProject(user.workspaceId, input.taskId, input.projectId))
  ) {
    return { error: "Selected task not found." };
  }

  try {
    const sql = getDb();
    await sql`
      update time_entries
      set project_id = ${input.projectId},
          task_id = ${emptyToNull(input.taskId)},
          description = ${emptyToNull(input.description)},
          date = ${input.date.trim() || todayISO()},
          duration_minutes = ${input.durationMinutes},
          billable = ${input.billable},
          hourly_rate = ${rateToDb(input.hourlyRate)},
          updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] update time entry failed:", err);
    return { error: "Could not update the time entry. Please try again." };
  }

  revalidatePath("/dashboard/time");
  revalidatePath(`/dashboard/time/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTimeEntryAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    await sql`
      delete from time_entries
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] delete time entry failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/time");
  revalidatePath(`/dashboard/time/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
