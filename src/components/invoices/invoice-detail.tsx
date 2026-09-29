"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { InvoiceStatusBadge } from "@/components/dashboard/status";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import {
  cancelInvoiceAction,
  markInvoiceOverdueAction,
  markInvoicePaidAction,
  markInvoiceSentAction,
} from "@/lib/invoices/actions";
import { formatBudget, formatDate, formatDuration } from "@/lib/format";
import type { Client, Invoice, InvoiceItem, InvoiceStatus, Project } from "@/types";

function effectiveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "sent" && invoice.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${invoice.dueDate}T00:00:00`) < today) return "overdue";
  }
  return invoice.status;
}

export function InvoiceDetail({
  invoice,
  clients,
  projects,
  items,
}: {
  invoice: Invoice;
  clients: Client[];
  projects: Project[];
  items: InvoiceItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const status = effectiveStatus(invoice);
  const clientLabel = invoice.clientCompany
    ? `${invoice.clientName} — ${invoice.clientCompany}`
    : invoice.clientName;

  async function run(action: (id: string) => Promise<{ ok: boolean }>) {
    setBusy(true);
    await action(invoice.id);
    setBusy(false);
    router.refresh();
  }

  const totals = [
    { label: "Subtotal", value: formatBudget(invoice.subtotal) },
    { label: "Tax", value: formatBudget(invoice.tax) },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard/invoices"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Invoices
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={status} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="surface" onClick={() => setEditing(true)}>
              <Pencil aria-hidden className="h-4 w-4" />
              Edit
            </Button>
            {invoice.status === "draft" ? (
              <Button
                size="sm"
                onClick={() => run(markInvoiceSentAction)}
                disabled={busy}
              >
                <Send aria-hidden className="h-4 w-4" />
                Mark as sent
              </Button>
            ) : null}
            {invoice.status === "sent" || invoice.status === "overdue" ? (
              <Button
                size="sm"
                onClick={() => run(markInvoicePaidAction)}
                disabled={busy}
              >
                <Check aria-hidden className="h-4 w-4" />
                Mark as paid
              </Button>
            ) : null}
            {invoice.status === "sent" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => run(markInvoiceOverdueAction)}
                disabled={busy}
              >
                <Clock aria-hidden className="h-4 w-4" />
                Mark overdue
              </Button>
            ) : null}
            {invoice.status !== "cancelled" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(`Cancel invoice ${invoice.invoiceNumber}?`)) {
                    run(cancelInvoiceAction);
                  }
                }}
                disabled={busy}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Client" />
          <Link
            href={`/dashboard/clients/${invoice.clientId}`}
            className="text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
          >
            {clientLabel}
          </Link>
          {invoice.clientEmail ? (
            <a
              href={`mailto:${invoice.clientEmail}`}
              className="mt-1 block text-sm text-muted transition-colors hover:text-primary-bright"
            >
              {invoice.clientEmail}
            </a>
          ) : null}
          {invoice.projectId && invoice.projectName ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs text-faint">Project</p>
              <Link
                href={`/dashboard/projects/${invoice.projectId}`}
                className="mt-1 inline-block text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
              >
                {invoice.projectName}
              </Link>
            </div>
          ) : null}
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Dates" />
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Issued</span>
              <span className="font-medium text-foreground">
                {formatDate(invoice.issueDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Due</span>
              <span
                className={
                  status === "overdue"
                    ? "font-medium text-red-300"
                    : "font-medium text-foreground"
                }
              >
                {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
              </span>
            </div>
          </div>
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Summary" />
          <div className="space-y-2 text-sm">
            {totals.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-muted">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="text-muted">Total</span>
              <span className="font-display text-base font-semibold text-foreground">
                {formatBudget(invoice.total)}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {items.length > 0 ? (
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Line items" />
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.description}
                  </p>
                  <p className="text-xs text-dim">
                    {formatDuration(Math.round(Number(item.quantity) * 60))} ×{" "}
                    {formatBudget(item.unitRate)}/hr
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  {formatBudget(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {invoice.notes ? (
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Notes" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {invoice.notes}
          </p>
        </Panel>
      ) : null}

      {editing ? (
        <InvoiceDialog
          invoice={invoice}
          clients={clients}
          projects={projects}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
