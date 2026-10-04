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
 * Lists clients, optionally filtered by status, search and — for a member —
 * restricted to clients of the projects they are assigned to (`memberUserId`).
 * Owners/admins omit `memberUserId` to see the whole workspace.
 */
export async function listClients(
  workspaceId: string,
  opts: {
    q?: string;
    status?: ClientStatus;
    memberUserId?: string;
  } = {},
): Promise<Client[]> {
  const sql = getDb();
  const term = opts.q?.trim() ? `%${opts.q.trim()}%` : null;
  const status = opts.status ?? null;
  const memberUserId = opts.memberUserId ?? null;

  const rows = (await sql.query(
    `select ${CLIENT_COLUMNS}
     from clients c
     where c.workspace_id = $1
       and ($2::text is null or c.status = $2)
       and ($3::text is null or c.name ilike $3 or c.company ilike $3 or c.email ilike $3)
       and ($4::text is null or (
         exists (
           select 1 from project_members pm
           join projects pr on pr.id = pm.project_id
           where pm.user_id = $4 and pr.client_id = c.id
         )
         or exists (
           select 1 from tasks t
           join projects pr on pr.id = t.project_id
           where t.assignee_user_id = $4 and pr.client_id = c.id
         )
       ))
     order by c.created_at desc`,
    [workspaceId, status, term, memberUserId],
  )) as ClientRow[];

  return rows.map(mapClient);
}

/**
 * Returns a single client scoped to the workspace and, for a member, restricted
 * to clients of their assigned projects. Returns `null` when it does not exist,
 * belongs to another workspace, or the member is not authorized to see it.
 */
export async function getClient(
  workspaceId: string,
  clientId: string,
  memberUserId?: string,
): Promise<Client | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${CLIENT_COLUMNS}
     from clients c
     where c.workspace_id = $1 and c.id = $2
       and ($3::text is null or (
         exists (
           select 1 from project_members pm
           join projects pr on pr.id = pm.project_id
           where pm.user_id = $3 and pr.client_id = c.id
         )
         or exists (
           select 1 from tasks t
           join projects pr on pr.id = t.project_id
           where t.assignee_user_id = $3 and pr.client_id = c.id
         )
       ))
     limit 1`,
    [workspaceId, clientId, memberUserId ?? null],
  )) as ClientRow[];

  return rows[0] ? mapClient(rows[0]) : null;
}
