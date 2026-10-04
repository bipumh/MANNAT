"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { Panel } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { InvoiceStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { cancelInvoiceAction } from "@/lib/invoices/actions";
import { formatBudget, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Client, Invoice, InvoiceStatus, Project } from "@/types";

const statusFilters: { label: string; value?: InvoiceStatus }[] = [
  { label: "All" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];

function effectiveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "sent" && invoice.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${invoice.dueDate}T00:00:00`) < today) return "overdue";
  }
  return invoice.status;
}

export function InvoicesView({
  invoices,
  clients,
  projects,
  query,
  status,
  clientId,
  projectId,
}: {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  query: string;
  status?: InvoiceStatus;
  clientId?: string;
  projectId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [dialog, setDialog] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Invoice | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (search === query) return;
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      if (clientId) params.set("client", clientId);
      if (projectId) params.set("project", projectId);
      const qs = params.toString();
      router.replace(`/dashboard/invoices${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(id);
  }, [search, query, status, clientId, projectId, router]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  function openCreate() {
    setDialog({ open: true, invoice: null });
  }

  function openEdit(invoice: Invoice) {
    setDialog({ open: true, invoice });
  }

  function onSaved() {
    setDialog({ open: false, invoice: null });
    setNotice("Invoice saved");
    router.refresh();
  }

  function cancel(invoice: Invoice) {
    setConfirm(invoice);
  }

  async function confirmCancel() {
    if (!confirm) return;
    setBusyId(confirm.id);
    await cancelInvoiceAction(confirm.id);
    setBusyId(null);
    setConfirm(null);
    setNotice("Invoice cancelled");
    router.refresh();
  }

  const href = (value?: InvoiceStatus) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (value) params.set("status", value);
    if (clientId) params.set("client", clientId);
    if (projectId) params.set("project", projectId);
    const qs = params.toString();
    return `/dashboard/invoices${qs ? `?${qs}` : ""}`;
  };

  function navigate(key: string, value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (clientId) params.set("client", clientId);
    if (projectId) params.set("project", projectId);
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(`/dashboard/invoices${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Invoices
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Invoices
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Create, track, and manage client billing.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus aria-hidden className="h-4 w-4" />
            New invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoices, clients or projects…"
            aria-label="Search invoices"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
            {statusFilters.map((filter) => {
              const active = status === filter.value;
              return (
                <Link
                  key={filter.label}
                  href={href(filter.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-[#05251c]"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          <select
            aria-label="Filter by client"
            value={clientId ?? ""}
            onChange={(event) => navigate("client", event.target.value)}
            className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by project"
            value={projectId ?? ""}
            onChange={(event) => navigate("project", event.target.value)}
            className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Toast message={notice} />

      {clients.length === 0 ? (
        <EmptyState
          title="Create a client first"
          description="Invoices must belong to a client, so create a client before creating an invoice."
          action={
            <Button href="/dashboard/clients">
              <Plus aria-hidden className="h-4 w-4" />
              Go to clients
            </Button>
          }
        />
      ) : invoices.length === 0 ? (
        query || status || clientId || projectId ? (
          <EmptyState
            title="No matching invoices"
            description="Try a different search or filter."
          />
        ) : (
          <EmptyState
            title="No invoices yet"
            description="Create your first invoice to start tracking client billing."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden className="h-4 w-4" />
                New invoice
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <Panel
            spotlight
            spotlightColor={SPOTLIGHT_NEUTRAL}
            className="hidden overflow-hidden p-0 md:block"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-dim">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((invoice) => {
                  const status = effectiveStatus(invoice);
                  return (
                    <tr
                      key={invoice.id}
                      className="group transition-colors hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="block"
                        >
                          <p className="font-medium tabular-nums text-foreground transition-colors group-hover:text-primary-bright">
                            {invoice.invoiceNumber}
                          </p>
                          {invoice.projectName ? (
                            <p className="text-xs text-dim">
                              {invoice.projectName}
                            </p>
                          ) : null}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {invoice.clientCompany
                          ? `${invoice.clientName} · ${invoice.clientCompany}`
                          : invoice.clientName}
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {formatDateShort(invoice.issueDate)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3.5 text-muted",
                          status === "overdue" && "text-red-300",
                        )}
                      >
                        {invoice.dueDate
                          ? formatDateShort(invoice.dueDate)
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-foreground">
                        {formatBudget(invoice.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <InvoiceStatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(invoice)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancel(invoice)}
                            disabled={busyId === invoice.id}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {invoices.map((invoice) => {
              const status = effectiveStatus(invoice);
              return (
                <Panel
                  key={invoice.id}
                  spotlight
                  spotlightColor={SPOTLIGHT_NEUTRAL}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="min-w-0"
                    >
                      <p className="font-medium tabular-nums text-foreground">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="truncate text-xs text-dim">
                        {invoice.clientName}
                      </p>
                    </Link>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatBudget(invoice.total)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <InvoiceStatusBadge status={status} />
                    {invoice.dueDate ? (
                      <span className="text-xs text-dim">
                        Due {formatDateShort(invoice.dueDate)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-line pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(invoice)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancel(invoice)}
                      disabled={busyId === invoice.id}
                    >
                      Cancel
                    </Button>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {dialog.open ? (
        <InvoiceDialog
          invoice={dialog.invoice}
          clients={clients}
          projects={projects}
          onClose={() => setDialog({ open: false, invoice: null })}
          onSaved={onSaved}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title="Cancel invoice"
          description={`Cancel invoice ${confirm.invoiceNumber}? It will be marked as cancelled and can't be reopened.`}
          confirmLabel="Cancel invoice"
          pending={busyId === confirm.id}
          onConfirm={confirmCancel}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
