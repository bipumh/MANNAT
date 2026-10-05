import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { InvoiceStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardInvoice, InvoiceCounts } from "@/lib/dashboard/queries";
import { formatCurrencyPrecise, formatDateOnlyShort } from "@/lib/format";

export function RecentInvoices({
  invoices,
  counts,
  outstanding,
  className,
}: {
  invoices: DashboardInvoice[];
  counts: InvoiceCounts;
  outstanding: number;
  className?: string;
}) {
  const summaries: { label: string; value: number }[] = [
    { label: "Draft", value: counts.draft },
    { label: "Sent", value: counts.sent },
    { label: "Paid", value: counts.paid },
    { label: "Overdue", value: counts.overdue },
  ];

  return (
    <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL} className={className}>
      <PanelHeader
        title="Recent invoices"
        description={`${formatCurrencyPrecise(outstanding)} outstanding`}
        action={
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
          >
            View all
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-2">
        {summaries.map((summary) => (
          <div
            key={summary.label}
            className="rounded-lg border border-line bg-surface-2/50 px-3 py-2"
          >
            <p className="text-xs text-dim">{summary.label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              {summary.value}
            </p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create an invoice from a client or project."
        />
      ) : (
        <ul className="divide-y divide-line">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-[11px] font-medium text-muted">
                  {invoice.invoiceNumber.replace("INV-", "")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {invoice.clientName ?? "No client"}
                  </p>
                  <p className="mt-0.5 text-xs text-dim">
                    {invoice.invoiceNumber} · {formatDateOnlyShort(invoice.issueDate)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {formatCurrencyPrecise(Number(invoice.total))}
                </span>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
