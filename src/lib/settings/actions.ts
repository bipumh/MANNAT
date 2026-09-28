"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
};

const MAX_NAME_LENGTH = 100;

export async function updateProfileAction(input: {
  fullName: string;
}): Promise<SettingsActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const fullName = input.fullName.trim();
  if (!fullName) return { error: "Name is required." };
  if (fullName.length > MAX_NAME_LENGTH) {
    return { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  try {
    const sql = getDb();
    await sql`
      update profiles
      set full_name = ${fullName}, updated_at = now()
      where id = ${user.id}
    `;
  } catch (err) {
    console.error("[mannat] update profile failed:", err);
    return { error: "Could not update your profile. Please try again." };
  }

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "profile.updated",
    entityType: "member",
    title: "Profile updated",
    description: "updated their profile",
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateWorkspaceAction(input: {
  name: string;
}): Promise<SettingsActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  if (user.role !== "owner" && user.role !== "admin") {
    return { error: "Only owners and admins can edit workspace settings." };
  }

  const name = input.name.trim();
  if (!name) return { error: "Workspace name is required." };
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Workspace name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  try {
    const sql = getDb();
    await sql`
      update workspaces
      set name = ${name}, updated_at = now()
      where id = ${user.workspaceId}
    `;
  } catch (err) {
    console.error("[mannat] update workspace failed:", err);
    return { error: "Could not update the workspace. Please try again." };
  }

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "workspace.updated",
    entityType: "member",
    title: "Workspace updated",
    description: `renamed the workspace to "${name}"`,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateNotificationPreferencesAction(input: {
  memberUpdates: boolean;
  invoiceUpdates: boolean;
}): Promise<SettingsActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  if (
    typeof input.memberUpdates !== "boolean" ||
    typeof input.invoiceUpdates !== "boolean"
  ) {
    return { error: "Invalid preferences." };
  }

  try {
    const sql = getDb();
    await sql`
      insert into notification_preferences (
        workspace_id, user_id, member_updates, invoice_updates
      )
      values (
        ${user.workspaceId},
        ${user.id},
        ${input.memberUpdates},
        ${input.invoiceUpdates}
      )
      on conflict (workspace_id, user_id) do update
      set member_updates = excluded.member_updates,
          invoice_updates = excluded.invoice_updates,
          updated_at = now()
    `;
  } catch (err) {
    console.error("[mannat] update notification preferences failed:", err);
    return { error: "Could not save your preferences. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
