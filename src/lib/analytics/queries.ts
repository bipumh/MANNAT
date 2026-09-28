import "server-only";

import { getDb } from "@/lib/db";
import type { RevenuePoint } from "@/types";

export type AnalyticsInvoiceStatus = {
  status: string;
  count: number;
  amount: number;
};

export type AnalyticsProjectStatus = {
  status: string;
  count: number;
};

export type AnalyticsTopClient = {
  clientId: string;
  name: string;
  paid: number;
};

export type Analytics = {
  revenue: RevenuePoint[];
  invoiceStatuses: AnalyticsInvoiceStatus[];
  projectStatuses: AnalyticsProjectStatus[];
  taskTotal: number;
  taskCompleted: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  topClients: AnalyticsTopClient[];
};

function firstOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Aggregated workspace analytics, computed entirely from real records.
 */
export async function getAnalytics(workspaceId: string): Promise<Analytics> {
  const sql = getDb();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startISO = firstOfMonth(start);

  const [
    revenueRows,
    invoiceStatusRows,
    projectStatusRows,
    taskRows,
    timeRows,
    topClientRows,
  ] = (await Promise.all([
    sql.query(
      `select to_char(date_trunc('month', issue_date), 'YYYY-MM') as month_key,
              coalesce(sum(total), 0)::float8 as revenue
       from invoices
       where workspace_id = $1 and status = 'paid' and issue_date >= $2::date
       group by date_trunc('month', issue_date)
       order by date_trunc('month', issue_date) asc`,
       [workspaceId, startISO],
    ),
    sql.query(
      `select status, count(*)::int as count, coalesce(sum(total), 0)::float8 as amount
       from invoices where workspace_id = $1 group by status`,
      [workspaceId],
    ),
    sql.query(
      `select status, count(*)::int as count
       from projects where workspace_id = $1 and archived = false group by status`,
      [workspaceId],
    ),
    sql.query(
      `select count(*)::int as total,
              count(*) filter (where status = 'completed')::int as completed
       from tasks where workspace_id = $1 and archived = false`,
      [workspaceId],
    ),
    sql.query(
      `select coalesce(sum(duration_minutes) filter (where billable), 0)::int as billable,
              coalesce(sum(duration_minutes) filter (where not billable), 0)::int as non_billable
       from time_entries where workspace_id = $1`,
      [workspaceId],
    ),
    sql.query(
      `select c.id, c.name, coalesce(sum(i.total) filter (where i.status = 'paid'), 0)::float8 as paid
       from clients c
       left join invoices i on i.client_id = c.id and i.status = 'paid'
       where c.workspace_id = $1
       group by c.id, c.name
       order by paid desc
       limit 5`,
      [workspaceId],
    ),
  ])) as unknown as [
    { month_key: string; revenue: number }[],
    { status: string; count: number; amount: number }[],
    { status: string; count: number }[],
    { total: number; completed: number }[],
    { billable: number; non_billable: number }[],
    { id: string; name: string; paid: number }[],
  ];

  const byKey = new Map(revenueRows.map((r) => [r.month_key, Number(r.revenue)]));
  const revenue: RevenuePoint[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenue.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      revenue: byKey.get(key) ?? 0,
      expenses: 0,
    });
  }

  return {
    revenue,
    invoiceStatuses: invoiceStatusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      amount: Number(r.amount),
    })),
    projectStatuses: projectStatusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    taskTotal: Number(taskRows[0]?.total ?? 0),
    taskCompleted: Number(taskRows[0]?.completed ?? 0),
    billableMinutes: Number(timeRows[0]?.billable ?? 0),
    nonBillableMinutes: Number(timeRows[0]?.non_billable ?? 0),
    topClients: topClientRows.map((r) => ({
      clientId: r.id,
      name: r.name,
      paid: Number(r.paid),
    })),
  };
}
