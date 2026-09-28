"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  const sql = getDb();
  await sql`
    update notifications
    set read_at = now()
    where workspace_id = ${user.workspaceId}
      and user_id = ${user.id}
      and id = ${id}
  `;

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  const sql = getDb();
  await sql`
    update notifications
    set read_at = now()
    where workspace_id = ${user.workspaceId}
      and user_id = ${user.id}
      and read_at is null
  `;

  revalidatePath("/dashboard");
  return { ok: true };
}
