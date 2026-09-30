"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import { canManage } from "@/lib/auth/roles";
import { notifyUser } from "@/lib/notifications/notify";
import type { ProjectPriority, ProjectStatus } from "@/types";

export type ProjectFormState = {
  error?: string;
  success?: boolean;
};

export type ProjectInput = {
  name: string;
  clientId: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
  budget: string;
};

function emptyToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function budgetToDb(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function validate(input: ProjectInput): string | null {
  if (!input.name.trim()) return "Project name is required.";
  if (!input.clientId) return "Select a client for this project.";

  if (input.startDate && Number.isNaN(Date.parse(input.startDate))) {
    return "Start date is invalid.";
  }
  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    return "Due date is invalid.";
  }
  if (input.startDate && input.dueDate && input.dueDate < input.startDate) {
    return "Due date must be on or after the start date.";
  }

  if (input.budget.trim()) {
    const n = Number(input.budget);
    if (!Number.isFinite(n) || n < 0) {
      return "Budget must be a non-negative number.";
    }
  }

  return null;
}

async function clientExistsInWorkspace(
  workspaceId: string,
  clientId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`select id from clients where id = ${clientId} and workspace_id = ${workspaceId}`;
  return rows.length > 0;
}

export async function createProjectAction(
  input: ProjectInput,
): Promise<ProjectFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await clientExistsInWorkspace(user.workspaceId, input.clientId))) {
    return { error: "Selected client not found." };
  }

  try {
    const sql = getDb();
    const rows = await sql`
      insert into projects (
        workspace_id, client_id, name, description, status, priority,
        start_date, due_date, budget
      )
      values (
        ${user.workspaceId},
        ${input.clientId},
        ${input.name.trim()},
        ${emptyToNull(input.description)},
        ${input.status},
        ${input.priority},
        ${emptyToNull(input.startDate)},
        ${emptyToNull(input.dueDate)},
        ${budgetToDb(input.budget)}
      )
      returning id
    `;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "project.created",
      entityType: "project",
      entityId: rows[0]?.id ?? null,
      title: "Project created",
      description: `created "${input.name.trim()}"`,
    });
  } catch (err) {
    console.error("[mannat] create project failed:", err);
    return { error: "Could not create the project. Please try again." };
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}

export async function updateProjectAction(
  id: string,
  input: ProjectInput,
): Promise<ProjectFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await clientExistsInWorkspace(user.workspaceId, input.clientId))) {
    return { error: "Selected client not found." };
  }

  try {
    const sql = getDb();
    await sql`
      update projects
      set client_id = ${input.clientId},
          name = ${input.name.trim()},
          description = ${emptyToNull(input.description)},
          status = ${input.status},
          priority = ${input.priority},
          start_date = ${emptyToNull(input.startDate)},
          due_date = ${emptyToNull(input.dueDate)},
          budget = ${budgetToDb(input.budget)},
          updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "project.updated",
      entityType: "project",
      entityId: id,
      title: "Project updated",
      description: `updated "${input.name.trim()}"`,
    });
  } catch (err) {
    console.error("[mannat] update project failed:", err);
    return { error: "Could not update the project. Please try again." };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${id}`);
  return { success: true };
}

/**
 * Soft-deletes a project by flagging it archived (safer than a hard delete,
 * which would break future task/invoice relationships). Scoped to the session's
 * workspace.
 */
export async function archiveProjectAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    await sql`
      update projects
      set archived = true, updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] archive project failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${id}`);
  return { ok: true };
}

/**
 * Replaces the set of members assigned to a project. Only owners/admins may
 * assign members; every supplied user id must belong to the current workspace.
 * The authenticated user's workspace/role are derived server-side.
 */
export async function setProjectMembersAction(
  projectId: string,
  userIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!canManage(user)) {
    return { ok: false, error: "You don't have permission to assign members." };
  }

  const sql = getDb();

  const projectRows = await sql`
    select id, name from projects
    where workspace_id = ${user.workspaceId} and id = ${projectId}
    limit 1
  `;
  if (projectRows.length === 0) {
    return { ok: false, error: "Project not found." };
  }
  const projectName = projectRows[0]?.name as string;

  const unique = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))];

  try {
    await sql`delete from project_members where workspace_id = ${user.workspaceId} and project_id = ${projectId}`;

    for (const memberUserId of unique) {
      const memberRows = await sql`
        select 1 from workspace_members
        where workspace_id = ${user.workspaceId} and user_id = ${memberUserId}
        limit 1
      `;
      if (memberRows.length === 0) continue;

      await sql`
        insert into project_members (workspace_id, project_id, user_id)
        values (${user.workspaceId}, ${projectId}, ${memberUserId})
        on conflict (project_id, user_id) do nothing
      `;

      if (memberUserId !== user.id) {
        await notifyUser({
          workspaceId: user.workspaceId,
          userId: memberUserId,
          type: "project.assigned",
          title: "Assigned to a project",
          message: `You were added to "${projectName}".`,
          entityType: "project",
          entityId: projectId,
        });
      }
    }
  } catch (err) {
    console.error("[mannat] set project members failed:", err);
    return { ok: false, error: "Could not update project members." };
  }

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "project.members_updated",
    entityType: "project",
    entityId: projectId,
    title: "Project team updated",
    description: `updated the team for "${projectName}"`,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/my-work");
  return { ok: true };
}
