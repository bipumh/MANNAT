"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import { notifyOwnersAndAdmins } from "@/lib/notifications/notify";

export type WorkLogFormState = {
  error?: string;
  success?: boolean;
};

export type WorkLogInput = {
  clientId: string;
  projectId: string;
  taskId: string;
  date: string;
  description: string;
  durationMinutes: number;
  billable: boolean;
  rate: string;
  notes: string;
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

/**
 * Creates a work-log record for the authenticated user. Ownership (`user_id`)
 * is always derived from the server session — never from the client. Client,
 * project and task are validated to belong to the session's workspace, and the
 * project must belong to the selected client.
 */
export async function createWorkLogAction(
  input: WorkLogInput,
): Promise<WorkLogFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  if (!input.clientId) return { error: "Select a client." };
  if (!input.projectId) return { error: "Select a project." };
  if (!input.description.trim()) return { error: "Describe the work performed." };

  const duration = Number(input.durationMinutes);
  if (!Number.isInteger(duration) || duration <= 0) {
    return { error: "Duration must be a positive whole number of minutes." };
  }

  if (input.date && Number.isNaN(Date.parse(input.date))) {
    return { error: "Date is invalid." };
  }

  const rate = rateToDb(input.rate);

  const sql = getDb();

  const projectRows = await sql`
    select client_id from projects
    where workspace_id = ${user.workspaceId} and id = ${input.projectId}
    limit 1
  `;
  const project = projectRows[0];
  if (!project) return { error: "Selected project not found." };
  if (project.client_id !== input.clientId) {
    return { error: "Selected project does not belong to the selected client." };
  }

  if (input.taskId) {
    const taskRows = await sql`
      select id from tasks
      where workspace_id = ${user.workspaceId}
        and id = ${input.taskId}
        and project_id = ${input.projectId}
      limit 1
    `;
    if (taskRows.length === 0) return { error: "Selected task not found." };
  }

  let workLogId: string;
  try {
    const rows = await sql`
      insert into work_logs (
        workspace_id, client_id, project_id, task_id, user_id, work_date,
        description, duration_minutes, billable, rate, notes
      )
      values (
        ${user.workspaceId},
        ${input.clientId},
        ${input.projectId},
        ${emptyToNull(input.taskId)},
        ${user.id},
        ${input.date.trim() || todayISO()},
        ${input.description.trim()},
        ${duration},
        ${input.billable},
        ${rate},
        ${emptyToNull(input.notes)}
      )
      returning id
    `;
    workLogId = rows[0]?.id as string;
  } catch (err) {
    console.error("[mannat] create work log failed:", err);
    return { error: "Could not record the work. Please try again." };
  }

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "work.logged",
    entityType: "work",
    entityId: workLogId,
    title: "Work recorded",
    description: `recorded ${input.description.trim().slice(0, 80)}`,
  });

  await notifyOwnersAndAdmins({
    workspaceId: user.workspaceId,
    type: "work.logged",
    title: "New work recorded",
    message: `${user.fullName} recorded work.`,
    entityType: "work",
    entityId: workLogId,
    excludeUserId: user.id,
    preferenceKey: "member_updates",
  });

  revalidatePath("/dashboard/my-work");
  revalidatePath("/dashboard/time");
  revalidatePath("/dashboard");
  return { success: true };
}
