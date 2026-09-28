"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import { notifyOwnersAndAdmins } from "@/lib/notifications/notify";
import type { InvoiceStatus } from "@/types";

export type InvoiceFormState = {
  error?: string;
  success?: boolean;
};

export type InvoiceInput = {
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  notes: string;
  status: InvoiceStatus;
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

// Money is handled in integer cents to avoid floating-point drift.
function moneyCents(value: string): number {
  const v = value.trim();
  if (!v) return 0;
  return Math.round(Number(v) * 100);
}

function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function validate(input: InvoiceInput): string | null {
  if (!input.clientId) return "Select a client for this invoice.";

  if (!input.subtotal.trim()) return "Subtotal is required.";
  const subtotal = Number(input.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return "Subtotal must be a non-negative number.";
  }

  if (input.tax.trim()) {
    const tax = Number(input.tax);
    if (!Number.isFinite(tax) || tax < 0) {
      return "Tax must be a non-negative number.";
    }
  }

  if (input.issueDate && Number.isNaN(Date.parse(input.issueDate))) {
    return "Issue date is invalid.";
  }
  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    return "Due date is invalid.";
  }
  if (input.issueDate && input.dueDate && input.dueDate < input.issueDate) {
    return "Due date must be on or after the issue date.";
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

async function projectExistsForClient(
  workspaceId: string,
  clientId: string,
  projectId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`select id from projects where id = ${projectId} and workspace_id = ${workspaceId} and client_id = ${clientId}`;
  return rows.length > 0;
}

/**
 * Atomically reserves the next per-workspace invoice number. Uses an
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` so concurrent creations
 * cannot produce duplicate numbers.
 */
async function nextInvoiceNumber(workspaceId: string): Promise<string> {
  const sql = getDb();
  const rows = await sql`
    insert into workspace_invoice_counters (workspace_id, next_number)
    values (${workspaceId}, 1)
    on conflict (workspace_id) do update
    set next_number = workspace_invoice_counters.next_number + 1
    returning next_number
  `;
  const seq = Number(rows[0]?.next_number);
  return `INV-${String(seq).padStart(4, "0")}`;
}

export async function createInvoiceAction(
  input: InvoiceInput,
): Promise<InvoiceFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await clientExistsInWorkspace(user.workspaceId, input.clientId))) {
    return { error: "Selected client not found." };
  }
  if (
    input.projectId &&
    !(await projectExistsForClient(user.workspaceId, input.clientId, input.projectId))
  ) {
    return { error: "Selected project not found." };
  }

  const issueDate = input.issueDate.trim() || todayISO();
  const subtotalCents = moneyCents(input.subtotal);
  const taxCents = moneyCents(input.tax);
  const totalCents = subtotalCents + taxCents;

  let invoiceNumber: string;
  try {
    invoiceNumber = await nextInvoiceNumber(user.workspaceId);
  } catch (err) {
    console.error("[mannat] invoice number generation failed:", err);
    return { error: "Could not generate an invoice number. Please try again." };
  }

  try {
    const sql = getDb();
    const rows = await sql`
      insert into invoices (
        workspace_id, client_id, project_id, invoice_number, status,
        issue_date, due_date, subtotal, tax, total, notes
      )
      values (
        ${user.workspaceId},
        ${input.clientId},
        ${emptyToNull(input.projectId)},
        ${invoiceNumber},
        ${input.status},
        ${issueDate},
        ${emptyToNull(input.dueDate)},
        ${formatCents(subtotalCents)},
        ${formatCents(taxCents)},
        ${formatCents(totalCents)},
        ${emptyToNull(input.notes)}
      )
      returning id
    `;
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType: "invoice.created",
      entityType: "invoice",
      entityId: rows[0]?.id ?? null,
      title: "Invoice created",
      description: `created "${invoiceNumber}"`,
    });
  } catch (err) {
    console.error("[mannat] create invoice failed:", err);
    return { error: "Could not create the invoice. Please try again." };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateInvoiceAction(
  id: string,
  input: InvoiceInput,
): Promise<InvoiceFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };

  const error = validate(input);
  if (error) return { error };

  if (!(await clientExistsInWorkspace(user.workspaceId, input.clientId))) {
    return { error: "Selected client not found." };
  }
  if (
    input.projectId &&
    !(await projectExistsForClient(user.workspaceId, input.clientId, input.projectId))
  ) {
    return { error: "Selected project not found." };
  }

  const subtotalCents = moneyCents(input.subtotal);
  const taxCents = moneyCents(input.tax);
  const totalCents = subtotalCents + taxCents;

  try {
    const sql = getDb();
    await sql`
      update invoices
      set client_id = ${input.clientId},
          project_id = ${emptyToNull(input.projectId)},
          status = ${input.status},
          issue_date = ${input.issueDate.trim() || todayISO()},
          due_date = ${emptyToNull(input.dueDate)},
          subtotal = ${formatCents(subtotalCents)},
          tax = ${formatCents(taxCents)},
          total = ${formatCents(totalCents)},
          notes = ${emptyToNull(input.notes)},
          updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id}
    `;
  } catch (err) {
    console.error("[mannat] update invoice failed:", err);
    return { error: "Could not update the invoice. Please try again." };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

async function transitionStatus(
  id: string,
  from: string[],
  to: InvoiceStatus,
): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  try {
    const sql = getDb();
    const placeholders = from.map((_, i) => `$${i + 3}`).join(", ");
    await sql.query(
      `update invoices
       set status = $${from.length + 3}, updated_at = now()
       where workspace_id = $1 and id = $2 and status in (${placeholders})`,
      [user.workspaceId, id, ...from, to],
    );
  } catch (err) {
    console.error(`[mannat] invoice status transition to ${to} failed:`, err);
    return false;
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard");
  return true;
}

async function logInvoiceStatusChange(
  id: string,
  eventType: string,
  title: string,
  verb: string,
  suffix: string,
  from: string[],
  to: InvoiceStatus,
): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const sql = getDb();
  const invoiceRows = await sql`
    select invoice_number
    from invoices
    where workspace_id = ${user.workspaceId} and id = ${id}
    limit 1
  `;
  const invoiceNumber = invoiceRows[0]?.invoice_number ?? null;

  const ok = await transitionStatus(id, from, to);

  if (ok && invoiceNumber) {
    await logActivity({
      workspaceId: user.workspaceId,
      actorUserId: user.id,
      eventType,
      entityType: "invoice",
      entityId: id,
      title,
      description: `${verb} "${invoiceNumber}"${suffix}`,
    });
    if (eventType === "invoice.paid") {
      await notifyOwnersAndAdmins({
        workspaceId: user.workspaceId,
        type: "invoice.paid",
        title: "Invoice paid",
        message: `Invoice ${invoiceNumber} was marked as paid.`,
        entityType: "invoice",
        entityId: id,
        excludeUserId: user.id,
        preferenceKey: "invoice_updates",
      });
    }
  }

  return ok;
}

export async function markInvoiceSentAction(id: string): Promise<{ ok: boolean }> {
  return {
    ok: await logInvoiceStatusChange(
      id,
      "invoice.sent",
      "Invoice sent",
      "sent",
      "",
      ["draft"],
      "sent",
    ),
  };
}

export async function markInvoicePaidAction(id: string): Promise<{ ok: boolean }> {
  return {
    ok: await logInvoiceStatusChange(
      id,
      "invoice.paid",
      "Invoice paid",
      "marked",
      " as paid",
      ["sent", "overdue"],
      "paid",
    ),
  };
}

export async function markInvoiceOverdueAction(id: string): Promise<{ ok: boolean }> {
  return {
    ok: await logInvoiceStatusChange(
      id,
      "invoice.overdue",
      "Invoice overdue",
      "marked",
      " as overdue",
      ["sent"],
      "overdue",
    ),
  };
}

export async function cancelInvoiceAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };

  try {
    const sql = getDb();
    await sql`
      update invoices
      set status = 'cancelled', updated_at = now()
      where workspace_id = ${user.workspaceId} and id = ${id} and status <> 'cancelled'
    `;
  } catch (err) {
    console.error("[mannat] cancel invoice failed:", err);
    return { ok: false };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
