"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import type { ClientStatus } from "@/types";

export type ClientFormState = {
  error?: string;
  success?: boolean;
};

export type ClientInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  status: ClientStatus;
};

function emptyToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function validateEmail(email: string): string | null {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export async function createClientAction(
  input: ClientInput,
): Promise<ClientFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const name = input.name.trim();
  if (!name) return { error: "Client name is required." };

  const emailError = validateEmail(input.email);
  if (emailError) return { error: emailError };

  try {
    const sql = getDb();
    const rows = await sql`
      insert into clients (workspace_id, name, company, email, phone, website, status, notes)
      values (
        ${user.workspaceId},
        ${name},
        ${emptyToNull(input.company)},
        ${emptyToNull(input.email)},
        ${emptyToNull(input.phone)},
        ${emptyToNull(input.website)},
        ${input.status},
        ${emptyToNull(input.notes)}
      )
      returning id
    `;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "client.created",
      entityType: "client",
      entityId: rows[0]?.id ?? null,
      title: "Client created",
      description: `created "${name}"`,
    });
  } catch (err) {
    console.error("[mannat] create client failed:", err);
    return { error: "Could not create the client. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function updateClientAction(
  id: string,
  input: ClientInput,
): Promise<ClientFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const name = input.name.trim();
  if (!name) return { error: "Client name is required." };

  const emailError = validateEmail(input.email);
  if (emailError) return { error: emailError };

  try {
    const sql = getDb();
    await sql`
      update clients
      set name = ${name},
          company = ${emptyToNull(input.company)},
          email = ${emptyToNull(input.email)},
          phone = ${emptyToNull(input.phone)},
          website = ${emptyToNull(input.website)},
          status = ${input.status},
          notes = ${emptyToNull(input.notes)},
          updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "client.updated",
      entityType: "client",
      entityId: id,
      title: "Client updated",
      description: `updated "${name}"`,
    });
  } catch (err) {
    console.error("[mannat] update client failed:", err);
    return { error: "Could not update the client. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { success: true };
}

/**
 * Soft-deletes a client by marking it inactive (safer than a hard delete, which
 * would break future project/invoice relationships). Scoped to the session's
 * workspace.
 */
export async function archiveClientAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    await sql`
      update clients
      set status = 'inactive', updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] archive client failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { ok: true };
}
