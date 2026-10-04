import { BarChart3 } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_EMERALD, SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { EmptyState } from "@/components/ui/empty-state";
import {
  InvoiceStatusBadge,
  ProjectStatusBadge,
} from "@/components/dashboard/status";
import { formatCurrencyPrecise, formatDuration } from "@/lib/format";
import type { Analytics } from "@/lib/analytics/queries";
import type { InvoiceStatus, ProjectStatus } from "@/types";

const invoiceOrder: InvoiceStatus[] = ["draft", "sent", "overdue", "paid", "cancelled"];
const projectOrder: ProjectStatus[] = ["planned", "in_progress", "on_hold", "completed"];

export function AnalyticsView({ data }: { data: Analytics }) {
  const hasRevenue = data.revenue.some((point) => point.revenue > 0);

  const invoiceByStatus = new Map(data.invoiceStatuses.map((s) => [s.status, s]));
  const projectByStatus = new Map(data.projectStatuses.map((s) => [s.status, s]));

  const taskPct =
    data.taskTotal > 0 ? Math.round((data.taskCompleted / data.taskTotal) * 100) : 0;
  const totalMinutes = data.billableMinutes + data.nonBillableMinutes;

  return (
    <div className="space-y-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Analytics
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Analytics
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Revenue, billing and delivery across your workspace.
          </p>
        </div>
      </div>

      <Panel
        spotlight
        spotlightColor={SPOTLIGHT_EMERALD}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative">
          <PanelHeader
            title="Revenue"
            description="Monthly paid revenue over the last 12 months"
          />
          {hasRevenue ? (
            <RevenueChart data={data.revenue} className="w-full" />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No paid revenue yet"
              description="Revenue will appear here once invoices are paid."
            />
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Invoices" description="By status" />
          <ul className="space-y-2.5 text-sm">
            {invoiceOrder.map((status) => {
              const row = invoiceByStatus.get(status);
              return (
                <li key={status} className="flex items-center justify-between gap-3">
                  <InvoiceStatusBadge status={status} />
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-right tabular-nums text-muted">
                      {row?.count ?? 0}
                    </span>
                    <span className="w-28 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrencyPrecise(row?.amount ?? 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Projects" description="Active, by status" />
          <ul className="space-y-2.5 text-sm">
            {projectOrder.map((status) => {
              const row = projectByStatus.get(status);
              return (
                <li key={status} className="flex items-center justify-between gap-3">
                  <ProjectStatusBadge status={status} />
                  <span className="tabular-nums font-semibold text-foreground">
                    {row?.count ?? 0}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Work" description="Tasks and time" />

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Task completion</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {data.taskCompleted} / {data.taskTotal}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-bright"
                  style={{ width: `${taskPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Billable time</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatDuration(data.billableMinutes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Non-billable time</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatDuration(data.nonBillableMinutes)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2">
                <span className="text-muted">Total tracked</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {formatDuration(totalMinutes)}
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader
          title="Top clients"
          description="By paid revenue"
        />
        {data.topClients.length === 0 ? (
          <p className="text-sm text-dim">No paid invoices yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.topClients.map((client, index) => (
              <li
                key={client.clientId}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface-2 text-xs font-medium tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {client.name}
                  </span>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {formatCurrencyPrecise(client.paid)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
