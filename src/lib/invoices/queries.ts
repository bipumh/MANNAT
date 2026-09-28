import "server-only";

import { getDb } from "@/lib/db";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types";

type InvoiceRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client_name: string | null;
  client_company: string | null;
  client_email: string | null;
  project_name: string | null;
};

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clientId: row.client_id,
    projectId: row.project_id ?? null,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date ?? null,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client_name ?? null,
    clientCompany: row.client_company ?? null,
    clientEmail: row.client_email ?? null,
    projectName: row.project_name ?? null,
  };
}

/**
 * Lists the workspace's invoices, joined with client (and optionally project),
 * filtered by status / client / project and a case-insensitive search across
 * invoice number, client name/company and project name.
 */
export async function listInvoices(
  workspaceId: string,
  opts: {
    q?: string;
    status?: InvoiceStatus;
    clientId?: string;
    projectId?: string;
  } = {},
): Promise<Invoice[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const status = opts.status ?? null;
  const clientId = opts.clientId ?? null;
  const projectId = opts.projectId ?? null;

  const rows = (await sql.query(
    `select
       i.id, i.workspace_id, i.client_id, i.project_id, i.invoice_number, i.status,
       i.issue_date, i.due_date, i.subtotal, i.tax, i.total, i.notes, i.created_at, i.updated_at,
       c.name as client_name, c.company as client_company,
       p.name as project_name
     from invoices i
     join clients c on c.id = i.client_id
     left join projects p on p.id = i.project_id
     where i.workspace_id = $1
       and ($2::text is null or i.status = $2)
       and ($3::text is null or i.client_id = $3::uuid)
       and ($4::text is null or i.project_id = $4::uuid)
       and ($5::text is null
            or i.invoice_number ilike $5
            or c.name ilike $5
            or c.company ilike $5
            or p.name ilike $5)
     order by i.created_at desc`,
    [workspaceId, status, clientId, projectId, term],
  )) as InvoiceRow[];

  return rows.map(mapInvoice);
}

/**
 * Returns a single invoice (joined with client and project) scoped to the
 * workspace, or `null` when it does not exist or belongs to another workspace.
 */
export async function getInvoice(
  workspaceId: string,
  invoiceId: string,
): Promise<Invoice | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select
       i.id, i.workspace_id, i.client_id, i.project_id, i.invoice_number, i.status,
       i.issue_date, i.due_date, i.subtotal, i.tax, i.total, i.notes, i.created_at, i.updated_at,
       c.name as client_name, c.company as client_company, c.email as client_email,
       p.name as project_name
     from invoices i
     join clients c on c.id = i.client_id
     left join projects p on p.id = i.project_id
     where i.workspace_id = $1 and i.id = $2
     limit 1`,
    [workspaceId, invoiceId],
  )) as InvoiceRow[];

  return rows[0] ? mapInvoice(rows[0]) : null;
}

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  time_entry_id: string | null;
  description: string | null;
  quantity: string;
  unit_rate: string;
  amount: string;
};

/**
 * Returns the line items for an invoice, scoped to the workspace.
 */
export async function getInvoiceItems(
  workspaceId: string,
  invoiceId: string,
): Promise<InvoiceItem[]> {
  const sql = getDb();

  const rows = (await sql.query(
    `select id, invoice_id, time_entry_id, description, quantity, unit_rate, amount
     from invoice_items
     where workspace_id = $1 and invoice_id = $2
     order by created_at asc, id asc`,
    [workspaceId, invoiceId],
  )) as InvoiceItemRow[];

  return rows.map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    timeEntryId: row.time_entry_id ?? null,
    description: row.description ?? null,
    quantity: row.quantity,
    unitRate: row.unit_rate,
    amount: row.amount,
  }));
}
