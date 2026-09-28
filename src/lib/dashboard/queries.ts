import "server-only";

import { getDb } from "@/lib/db";
import { getRecentActivity } from "@/lib/activity/queries";
import type {
  ActivityEvent,
  InvoiceStatus,
  ProjectPriority,
  ProjectStatus,
  RevenuePoint,
  TaskPriority,
  TaskStatus,
} from "@/types";

export type DashboardOverview = {
  totalRevenue: number;
  outstanding: number;
  activeClients: number;
  activeProjects: number;
  openTasks: number;
  trackedMinutes: number;
};

export type DashboardProject = {
  id: string;
  name: string;
  clientName: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  dueDate: string | null;
  totalTasks: number;
  completedTasks: number;
};

export type DashboardTask = {
  id: string;
  title: string;
  projectName: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  status: TaskStatus;
};

export type DashboardInvoice = {
  id: string;
  invoiceNumber: string;
  clientName: string | null;
  total: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
};

export type InvoiceCounts = {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
};

function firstOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Aggregates the workspace's headline metrics in a single query (scalar
 * subqueries) so the dashboard never issues a query per metric.
 */
export async function getDashboardOverview(
  workspaceId: string,
): Promise<DashboardOverview> {
  const sql = getDb();
  const monthStart = firstOfMonth(new Date());

  const rows = await sql.query(
    `select
       coalesce((select sum(total) from invoices
                 where workspace_id = $1 and status = 'paid'), 0)::float8 as total_revenue,
       coalesce((select sum(total) from invoices
                 where workspace_id = $1 and status in ('sent', 'overdue')), 0)::float8 as outstanding,
       (select count(*) from clients
        where workspace_id = $1 and status = 'active')::int as active_clients,
       (select count(*) from projects
        where workspace_id = $1 and archived = false and status <> 'completed')::int as active_projects,
       (select count(*) from tasks
        where workspace_id = $1 and archived = false and status <> 'completed')::int as open_tasks,
       coalesce((select sum(duration_minutes) from time_entries
                 where workspace_id = $1 and date >= $2::date), 0)::int as tracked_minutes`,
    [workspaceId, monthStart],
  );

  const row = rows[0] ?? {};
  return {
    totalRevenue: Number(row.total_revenue ?? 0),
    outstanding: Number(row.outstanding ?? 0),
    activeClients: Number(row.active_clients ?? 0),
    activeProjects: Number(row.active_projects ?? 0),
    openTasks: Number(row.open_tasks ?? 0),
    trackedMinutes: Number(row.tracked_minutes ?? 0),
  };
}

/**
 * Monthly paid revenue for the last six months. Revenue is attributed to the
 * invoice `issue_date` (there is no `paid_at` column), with no expense data.
 */
export async function getDashboardRevenue(
  workspaceId: string,
): Promise<RevenuePoint[]> {
  const sql = getDb();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startISO = firstOfMonth(start);

  const rows = await sql.query(
    `select
       to_char(date_trunc('month', issue_date), 'YYYY-MM') as month_key,
       coalesce(sum(total), 0)::float8 as revenue
     from invoices
     where workspace_id = $1 and status = 'paid' and issue_date >= $2::date
     group by date_trunc('month', issue_date)
     order by date_trunc('month', issue_date) asc`,
    [workspaceId, startISO],
  ) as { month_key: string; revenue: number }[];

  const byKey = new Map(rows.map((r) => [r.month_key, Number(r.revenue)]));

  const buckets: RevenuePoint[] = [];
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      revenue: byKey.get(key) ?? 0,
      expenses: 0,
    });
  }

  return buckets;
}

/**
 * Most recently updated non-archived projects with real task-based progress
 * (completed tasks / total tasks).
 */
export async function getDashboardProjects(
  workspaceId: string,
  limit = 5,
): Promise<DashboardProject[]> {
  const sql = getDb();
  const rows = await sql.query(
    `select
       p.id, p.name, p.status, p.priority, p.due_date,
       c.name as client_name,
       count(t.id)::int as total_tasks,
       count(t.id) filter (where t.status = 'completed')::int as completed_tasks
     from projects p
     join clients c on c.id = p.client_id
     left join tasks t on t.project_id = p.id and t.archived = false
     where p.workspace_id = $1 and p.archived = false
     group by p.id, p.name, p.status, p.priority, p.due_date, c.name
     order by max(p.updated_at) desc
     limit $2`,
    [workspaceId, limit],
  ) as {
    id: string;
    name: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    due_date: string | null;
    client_name: string | null;
    total_tasks: number;
    completed_tasks: number;
  }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    clientName: row.client_name ?? null,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? null,
    totalTasks: Number(row.total_tasks),
    completedTasks: Number(row.completed_tasks),
  }));
}

/**
 * Recent open tasks (overdue first) plus the number of overdue open tasks
 * ("needs attention").
 */
export async function getDashboardTasks(
  workspaceId: string,
  limit = 5,
): Promise<{ tasks: DashboardTask[]; needsAttention: number }> {
  const sql = getDb();

  const [taskRows, attentionRows] = (await Promise.all([
    sql.query(
      `select
         t.id, t.title, t.status, t.priority, t.due_date,
         p.name as project_name
       from tasks t
       join projects p on p.id = t.project_id
       where t.workspace_id = $1 and t.archived = false and t.status <> 'completed'
       order by
         case when t.due_date is not null and t.due_date < current_date then 0 else 1 end,
         t.due_date asc nulls last,
         t.created_at desc
       limit $2`,
      [workspaceId, limit],
    ),
    sql.query(
      `select count(*)::int as count
       from tasks
       where workspace_id = $1 and archived = false and status <> 'completed'
         and due_date is not null and due_date < current_date`,
      [workspaceId],
    ),
  ])) as [
    {
      id: string;
      title: string;
      status: TaskStatus;
      priority: TaskPriority;
      due_date: string | null;
      project_name: string | null;
    }[],
    { count: number }[],
  ];

  return {
    tasks: taskRows.map((row) => ({
      id: row.id,
      title: row.title,
      projectName: row.project_name ?? null,
      priority: row.priority,
      dueDate: row.due_date ?? null,
      status: row.status,
    })),
    needsAttention: Number(attentionRows[0]?.count ?? 0),
  };
}

/**
 * Recent invoices plus per-status counts.
 */
export async function getDashboardInvoices(
  workspaceId: string,
  limit = 5,
): Promise<{ invoices: DashboardInvoice[]; counts: InvoiceCounts }> {
  const sql = getDb();

  const [invoiceRows, countRows] = (await Promise.all([
    sql.query(
      `select
         i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.total,
         c.name as client_name
       from invoices i
       join clients c on c.id = i.client_id
       where i.workspace_id = $1
       order by i.created_at desc
       limit $2`,
      [workspaceId, limit],
    ),
    sql.query(
      `select status, count(*)::int as count
       from invoices
       where workspace_id = $1
       group by status`,
      [workspaceId],
    ),
  ])) as [
    {
      id: string;
      invoice_number: string;
      status: InvoiceStatus;
      issue_date: string;
      due_date: string | null;
      total: string;
      client_name: string | null;
    }[],
    { status: string; count: number }[],
  ];

  const counts: InvoiceCounts = { draft: 0, sent: 0, paid: 0, overdue: 0 };
  for (const row of countRows) {
    if (row.status in counts) {
      counts[row.status as keyof InvoiceCounts] = Number(row.count);
    }
  }

  return {
    invoices: invoiceRows.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      clientName: row.client_name ?? null,
      total: row.total,
      status: row.status,
      issueDate: row.issue_date,
      dueDate: row.due_date ?? null,
    })),
    counts,
  };
}

export async function getDashboardActivity(
  workspaceId: string,
  limit = 6,
): Promise<ActivityEvent[]> {
  return getRecentActivity(workspaceId, limit);
}
