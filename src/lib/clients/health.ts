import "server-only";

import { getDb } from "@/lib/db";

export type ClientHealthStatus = "healthy" | "watch" | "attention";

export type ClientHealth = {
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  activeProjects: number;
  completedProjects: number;
  openTasks: number;
  overdueInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  health: ClientHealthStatus;
};

type ClientHealthRow = {
  id: string;
  name: string;
  company: string | null;
  active_projects: number;
  completed_projects: number;
  open_tasks: number;
  overdue_invoices: number;
  total_invoiced: number;
  total_paid: number;
};

/**
 * Per-client health derived only from real workspace data.
 *
 * Status rules (deterministic):
 * - "attention"  → the client has overdue invoices
 * - "watch"      → the client has open tasks but no overdue invoices
 * - "healthy"    → otherwise
 */
export async function getClientHealth(
  workspaceId: string,
): Promise<ClientHealth[]> {
  const sql = getDb();

  const rows = (await sql.query(
    `select
       c.id, c.name, c.company,
       (select count(*)::int from projects p
        where p.client_id = c.id and p.archived = false and p.status <> 'completed') as active_projects,
       (select count(*)::int from projects p
        where p.client_id = c.id and p.status = 'completed') as completed_projects,
       (select count(*)::int from tasks t
        join projects p on p.id = t.project_id
        where p.client_id = c.id and t.archived = false and t.status <> 'completed') as open_tasks,
       (select count(*)::int from invoices i
        where i.client_id = c.id
          and (i.status = 'overdue' or (i.status = 'sent' and i.due_date < current_date))) as overdue_invoices,
       (select coalesce(sum(i.total), 0)::float8 from invoices i
        where i.client_id = c.id and i.status in ('sent', 'paid', 'overdue')) as total_invoiced,
       (select coalesce(sum(i.total), 0)::float8 from invoices i
        where i.client_id = c.id and i.status = 'paid') as total_paid
     from clients c
     where c.workspace_id = $1
     order by c.created_at desc`,
    [workspaceId],
  )) as ClientHealthRow[];

  return rows.map((row) => {
    const overdueInvoices = Number(row.overdue_invoices);
    const openTasks = Number(row.open_tasks);
    const health: ClientHealthStatus =
      overdueInvoices > 0 ? "attention" : openTasks > 0 ? "watch" : "healthy";

    return {
      clientId: row.id,
      clientName: row.name,
      clientCompany: row.company ?? null,
      activeProjects: Number(row.active_projects),
      completedProjects: Number(row.completed_projects),
      openTasks,
      overdueInvoices,
      totalInvoiced: Number(row.total_invoiced),
      totalPaid: Number(row.total_paid),
      health,
    };
  });
}
