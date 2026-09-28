import "server-only";

import { getDb } from "@/lib/db";

export type ProjectFinancialStatus = "on-track" | "watch" | "over-budget" | "no-budget";

export type ProjectProfitability = {
  budget: string | null;
  invoicedAmount: number;
  paidAmount: number;
  billableMinutes: number;
  billableValue: number;
  remainingBudget: number | null;
  totalTasks: number;
  completedTasks: number;
  status: ProjectFinancialStatus;
};

type Row = {
  budget: string | null;
  invoiced_amount: number;
  paid_amount: number;
  billable_minutes: number;
  billable_value: number;
  total_tasks: number;
  completed_tasks: number;
};

const WATCH_THRESHOLD = 0.8;

/**
 * Project financial snapshot computed only from real data:
 * - invoiced = sent + paid + overdue invoice totals
 * - paid     = paid invoice totals
 * - billable value = Σ (duration_minutes / 60 × entry hourly_rate)
 *
 * Status rules (deterministic):
 * - "over-budget" → billable value exceeds budget
 * - "watch"       → billable value >= 80% of budget
 * - "on-track"    → otherwise
 * - "no-budget"   → project has no budget set
 */
export async function getProjectProfitability(
  workspaceId: string,
  projectId: string,
): Promise<ProjectProfitability | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select
       p.budget,
       (select coalesce(sum(i.total), 0)::float8 from invoices i
        where i.project_id = p.id and i.status in ('sent', 'paid', 'overdue')) as invoiced_amount,
       (select coalesce(sum(i.total), 0)::float8 from invoices i
        where i.project_id = p.id and i.status = 'paid') as paid_amount,
       (select coalesce(sum(t.duration_minutes), 0)::int from time_entries t
        where t.project_id = p.id and t.billable = true) as billable_minutes,
       (select coalesce(sum(t.duration_minutes::float8 / 60 * coalesce(t.hourly_rate, 0)), 0)::float8
        from time_entries t where t.project_id = p.id and t.billable = true) as billable_value,
       (select count(*)::int from tasks t
        where t.project_id = p.id and t.archived = false) as total_tasks,
       (select count(*)::int from tasks t
        where t.project_id = p.id and t.archived = false and t.status = 'completed') as completed_tasks
     from projects p
     where p.workspace_id = $1 and p.id = $2
     limit 1`,
    [workspaceId, projectId],
  )) as Row[];

  const row = rows[0];
  if (!row) return null;

  const budget = row.budget;
  const budgetNum = budget ? Number(budget) : null;
  const billableValue = Number(row.billable_value);

  let status: ProjectFinancialStatus = "no-budget";
  let remainingBudget: number | null = null;
  if (budgetNum !== null) {
    remainingBudget = budgetNum - billableValue;
    if (billableValue > budgetNum) status = "over-budget";
    else if (billableValue >= budgetNum * WATCH_THRESHOLD) status = "watch";
    else status = "on-track";
  }

  return {
    budget,
    invoicedAmount: Number(row.invoiced_amount),
    paidAmount: Number(row.paid_amount),
    billableMinutes: Number(row.billable_minutes),
    billableValue,
    remainingBudget,
    totalTasks: Number(row.total_tasks),
    completedTasks: Number(row.completed_tasks),
    status,
  };
}
