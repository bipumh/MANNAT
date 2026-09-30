"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import { canManage } from "@/lib/auth/roles";
import { notifyUser } from "@/lib/notifications/notify";
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

/**
 * Assigns (or unassigns) a task to a workspace member. Only owners/admins may
 * assign tasks. The assignee must be a current workspace member. Pass
 * `assigneeUserId` as `null` (or empty) to clear the assignment.
 */
export async function assignTaskAction(
  id: string,
  assigneeUserId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!canManage(user)) {
    return { ok: false, error: "You don't have permission to assign tasks." };
  }

  const sql = getDb();

  const taskRows = await sql`
    select title from tasks
    where workspace_id = ${user.workspaceId} and id = ${id}
    limit 1
  `;
  if (taskRows.length === 0) return { ok: false, error: "Task not found." };
  const taskTitle = taskRows[0]?.title as string;

  const nextAssignee = assigneeUserId?.trim() || null;

  if (nextAssignee) {
    const memberRows = await sql`
      select 1 from workspace_members
      where workspace_id = ${user.workspaceId} and user_id = ${nextAssignee}
      limit 1
    `;
    if (memberRows.length === 0) {
      return { ok: false, error: "Selected member not found." };
    }
  }

  try {
    await sql`
      update tasks
      set assignee_user_id = ${nextAssignee}, updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] assign task failed:", err);
    return { ok: false, error: "Could not assign the task." };
  }

  if (nextAssignee && nextAssignee !== user.id) {
    await notifyUser({
      workspaceId: user.workspaceId,
      userId: nextAssignee,
      type: "task.assigned",
      title: "Task assigned to you",
      message: `"${taskTitle}" was assigned to you.`,
      entityType: "task",
      entityId: id,
    });
  }

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "task.assigned",
    entityType: "task",
    entityId: id,
    title: "Task assigned",
    description: `assigned "${taskTitle}"`,
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard/my-work");
  return { ok: true };
}
