"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import type { TaskPriority, TaskStatus } from "@/types";

export type TaskFormState = {
  error?: string;
  success?: boolean;
};

export type TaskInput = {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

function emptyToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function validate(input: TaskInput): string | null {
  if (!input.title.trim()) return "Task title is required.";
  if (!input.projectId) return "Select a project for this task.";
  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    return "Due date is invalid.";
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

export async function createTaskAction(
  input: TaskInput,
): Promise<TaskFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await projectExistsInWorkspace(user.workspaceId, input.projectId))) {
    return { error: "Selected project not found." };
  }

  const completedAt = input.status === "completed" ? new Date().toISOString() : null;

  try {
    const sql = getDb();
    const rows = await sql`
      insert into tasks (
        workspace_id, project_id, title, description, status, priority,
        due_date, completed_at
      )
      values (
        ${user.workspaceId},
        ${input.projectId},
        ${input.title.trim()},
        ${emptyToNull(input.description)},
        ${input.status},
        ${input.priority},
        ${emptyToNull(input.dueDate)},
        ${completedAt}
      )
      returning id
    `;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "task.created",
      entityType: "task",
      entityId: rows[0]?.id ?? null,
      title: "Task created",
      description: `created "${input.title.trim()}"`,
    });
  } catch (err) {
    console.error("[mannat] create task failed:", err);
    return { error: "Could not create the task. Please try again." };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskAction(
  id: string,
  input: TaskInput,
): Promise<TaskFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await projectExistsInWorkspace(user.workspaceId, input.projectId))) {
    return { error: "Selected project not found." };
  }

  try {
    const sql = getDb();
    await sql`
      update tasks
      set project_id = ${input.projectId},
          title = ${input.title.trim()},
          description = ${emptyToNull(input.description)},
          status = ${input.status},
          priority = ${input.priority},
          due_date = ${emptyToNull(input.dueDate)},
          completed_at = case
            when ${input.status} = 'completed' then coalesce(completed_at, now())
            else null
          end,
          updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] update task failed:", err);
    return { error: "Could not update the task. Please try again." };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeTaskAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    const rows = await sql`
      update tasks
      set status = 'completed', completed_at = now(), updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
      returning title
    `;
    if (rows[0]) {
      await logActivity({
        workspaceId: user.workspaceId,
        actorUserId: user.id,
        eventType: "task.completed",
        entityType: "task",
        entityId: id,
        title: "Task completed",
        description: `completed "${rows[0].title}"`,
      });
    }
  } catch (err) {
    console.error("[mannat] complete task failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function reopenTaskAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    const rows = await sql`
      update tasks
      set status = 'todo', completed_at = null, updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
      returning title
    `;
    if (rows[0]) {
      await logActivity({
        workspaceId: user.workspaceId,
        actorUserId: user.id,
        eventType: "task.reopened",
        entityType: "task",
        entityId: id,
        title: "Task reopened",
        description: `reopened "${rows[0].title}"`,
      });
    }
  } catch (err) {
    console.error("[mannat] reopen task failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Soft-deletes a task by flagging it archived (safer than a hard delete, which
 * would destroy task history). Scoped to the session's workspace.
 */
export async function archiveTaskAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    await sql`
      update tasks
      set archived = true, updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] archive task failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
