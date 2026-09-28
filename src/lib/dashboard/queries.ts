import "server-only";

import { getDb } from "@/lib/db";
import { getRecentActivity } from "@/lib/activity/queries";
import { formatCurrencyPrecise, formatDuration } from "@/lib/format";
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

export type PulseSeverity = "danger" | "warning" | "info";

export type PulseItem = {
  id: string;
  severity: PulseSeverity;
  title: string;
  message: string;
  href: string;
};

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${iso}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

/**
 * Deterministic "what needs attention" signals, derived only from real
 * workspace data (no predictions / ML).
 */
export async function getBusinessPulse(
  workspaceId: string,
): Promise<PulseItem[]> {
  const sql = getDb();

  const [
    overdueInvoices,
    dueSoonInvoices,
    overdueTasks,
    dueSoonProjects,
    lowCompletionProjects,
    unbilled,
  ] = (await Promise.all([
    sql.query(
      `select count(*)::int as count, coalesce(sum(total), 0)::float8 as amount
       from invoices
       where workspace_id = $1
         and (status = 'overdue' or (status = 'sent' and due_date < current_date))`,
      [workspaceId],
    ),
    sql.query(
      `select count(*)::int as count
       from invoices
       where workspace_id = $1 and status = 'sent'
         and due_date >= current_date
         and due_date <= current_date + interval '7 days'`,
      [workspaceId],
    ),
    sql.query(
      `select count(*)::int as count
       from tasks
       where workspace_id = $1 and archived = false and status <> 'completed'
         and due_date is not null and due_date < current_date`,
      [workspaceId],
    ),
    sql.query(
      `select id, name, due_date
       from projects
       where workspace_id = $1 and archived = false and status <> 'completed'
         and due_date >= current_date
         and due_date <= current_date + interval '7 days'
       order by due_date asc
       limit 3`,
      [workspaceId],
    ),
    sql.query(
      `select p.id, p.name,
              count(t.id)::int as total,
              count(t.id) filter (where t.status = 'completed')::int as done
       from projects p
       join tasks t on t.project_id = p.id and t.archived = false
       where p.workspace_id = $1 and p.archived = false and p.status <> 'completed'
       group by p.id, p.name
       having count(t.id) > 0
          and count(t.id) filter (where t.status = 'completed')::float8 / count(t.id) < 0.3
       order by (count(t.id) filter (where t.status = 'completed')::float8 / count(t.id)) asc
       limit 2`,
      [workspaceId],
    ),
    sql.query(
      `select coalesce(sum(duration_minutes), 0)::int as minutes
       from time_entries
       where workspace_id = $1 and billable = true
         and not exists (
           select 1 from invoice_items ii where ii.time_entry_id = time_entries.id
         )`,
      [workspaceId],
    ),
  ])) as [
    { count: number; amount: number }[],
    { count: number }[],
    { count: number }[],
    { id: string; name: string; due_date: string }[],
    { id: string; name: string; total: number; done: number }[],
    { minutes: number }[],
  ];

  const items: PulseItem[] = [];

  const oi = overdueInvoices[0];
  if (oi && Number(oi.count) > 0) {
    items.push({
      id: "overdue-invoices",
      severity: "danger",
      title: `${oi.count} ${Number(oi.count) === 1 ? "invoice is" : "invoices are"} overdue`,
      message: `${formatCurrencyPrecise(Number(oi.amount))} past due`,
      href: "/dashboard/invoices?status=overdue",
    });
  }

  const ds = dueSoonInvoices[0];
  if (ds && Number(ds.count) > 0) {
    items.push({
      id: "invoices-due-soon",
      severity: "warning",
      title: `${ds.count} ${Number(ds.count) === 1 ? "invoice is" : "invoices are"} due within 7 days`,
      message: "Review upcoming billing",
      href: "/dashboard/invoices?status=sent",
    });
  }

  const ot = overdueTasks[0];
  if (ot && Number(ot.count) > 0) {
    items.push({
      id: "overdue-tasks",
      severity: "warning",
      title: `${ot.count} ${Number(ot.count) === 1 ? "task is" : "tasks are"} overdue`,
      message: "These need attention",
      href: "/dashboard/tasks",
    });
  }

  for (const p of dueSoonProjects) {
    const days = daysUntil(p.due_date);
    items.push({
      id: `project-due-${p.id}`,
      severity: "warning",
      title: `${p.name} is due ${days <= 0 ? "today" : `in ${days} ${days === 1 ? "day" : "days"}`}`,
      message: "Deadline approaching",
      href: `/dashboard/projects/${p.id}`,
    });
  }

  for (const p of lowCompletionProjects) {
    const pct = Math.round((Number(p.done) / Number(p.total)) * 100);
    items.push({
      id: `project-progress-${p.id}`,
      severity: "info",
      title: `${p.name} is ${pct}% complete`,
      message: `${p.done} of ${p.total} tasks done`,
      href: `/dashboard/projects/${p.id}`,
    });
  }

  const ub = unbilled[0];
  if (ub && Number(ub.minutes) > 0) {
    items.push({
      id: "unbilled-time",
      severity: "info",
      title: `${formatDuration(Number(ub.minutes))} of billable time is ready to invoice`,
      message: "Convert tracked time into an invoice",
      href: "/dashboard/time",
    });
  }

  return items;
}
