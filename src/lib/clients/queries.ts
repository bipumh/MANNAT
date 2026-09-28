import "server-only";

import { getDb } from "@/lib/db";
import type { Client, ClientStatus } from "@/types";

type ClientRow = {
  id: string;
  workspace_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    website: row.website,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CLIENT_COLUMNS =
  "id, workspace_id, name, company, email, phone, website, status, notes, created_at, updated_at";

/**
 * Lists the authenticated workspace's clients, optionally filtered by status and
 * a case-insensitive search across name / company / email.
 */
export async function listClients(
  workspaceId: string,
  opts: { q?: string; status?: ClientStatus } = {},
): Promise<Client[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const status = opts.status ?? null;

  const rows = (await sql.query(
    `select ${CLIENT_COLUMNS}
     from clients
     where workspace_id = $1
       and ($2::text is null or status = $2)
       and ($3::text is null or name ilike $3 or company ilike $3 or email ilike $3)
     order by created_at desc`,
    [workspaceId, status, term],
  )) as ClientRow[];

  return rows.map(mapClient);
}

/**
 * Returns a single client scoped to the workspace, or `null` when it does not
 * exist or belongs to another workspace (so callers can 404).
 */
export async function getClient(
  workspaceId: string,
  clientId: string,
): Promise<Client | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${CLIENT_COLUMNS}
     from clients
     where workspace_id = $1 and id = $2
     limit 1`,
    [workspaceId, clientId],
  )) as ClientRow[];

  return rows[0] ? mapClient(rows[0]) : null;
}
