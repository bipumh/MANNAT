"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  FolderKanban,
  Globe,
  Mail,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { ClientStatusBadge, InvoiceStatusBadge, ProjectStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientDialog } from "@/components/clients/client-dialog";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { WorkHistory } from "@/components/work-log/work-history";
import { formatBudget, formatDate, formatDateShort } from "@/lib/format";
import type { Client, Invoice, Project, WorkLog } from "@/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ClientDetail({
  client,
  invoices,
  clients,
  projects,
  workLogs,
  canManage,
}: {
  client: Client;
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  workLogs: WorkLog[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newInvoice, setNewInvoice] = useState(false);

  const hasContact = Boolean(client.email || client.phone || client.website);
  const clientProjects = projects.filter((project) => project.clientId === client.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard/clients"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Clients
            </Link>
            <div className="mt-3 flex items-center gap-4">
              <Avatar
                initials={initials(client.name)}
                className="h-14 w-14 text-base"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {client.name}
                  </h1>
                  <ClientStatusBadge status={client.status} />
                </div>
                {client.company ? (
                  <p className="mt-1 text-sm text-muted">{client.company}</p>
                ) : null}
              </div>
            </div>
          </div>
          {canManage ? (
            <Button size="sm" variant="surface" onClick={() => setEditing(true)}>
              <Pencil aria-hidden className="h-4 w-4" />
              Edit
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Contact" />
          {hasContact ? (
            <ul className="space-y-3 text-sm">
              {client.email ? (
                <li className="flex items-center gap-2.5">
                  <Mail aria-hidden className="h-4 w-4 shrink-0 text-faint" />
                  <a
                    href={`mailto:${client.email}`}
                    className="truncate text-foreground transition-colors hover:text-primary-bright"
                  >
                    {client.email}
                  </a>
                </li>
              ) : null}
              {client.phone ? (
                <li className="flex items-center gap-2.5">
                  <Phone aria-hidden className="h-4 w-4 shrink-0 text-faint" />
                  <span className="text-foreground">{client.phone}</span>
                </li>
              ) : null}
              {client.website ? (
                <li className="flex items-center gap-2.5">
                  <Globe aria-hidden className="h-4 w-4 shrink-0 text-faint" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-foreground transition-colors hover:text-primary-bright"
                  >
                    {client.website}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm text-dim">No contact details added.</p>
          )}
        </Panel>

        <Panel
          spotlight
          spotlightColor={SPOTLIGHT_NEUTRAL}
          className="lg:col-span-2"
        >
          <PanelHeader title="Notes" />
          {client.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {client.notes}
            </p>
          ) : (
            <p className="text-sm text-dim">No notes yet.</p>
          )}
          <p className="mt-6 border-t border-line pt-4 text-xs text-faint">
            Client since {formatDate(client.createdAt)}
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="Projects"
            description={
              clientProjects.length > 0
                ? `${clientProjects.length} ${
                    clientProjects.length === 1 ? "project" : "projects"
                  }`
                : undefined
            }
          />
          {clientProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Projects you create for this client will appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {clientProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-medium text-foreground transition-colors hover:text-primary-bright">
                      {project.name}
                    </p>
                    {project.dueDate ? (
                      <p className="text-xs text-dim">
                        Due {formatDateShort(project.dueDate)}
                      </p>
                    ) : null}
                  </Link>
                  <ProjectStatusBadge status={project.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="Invoices"
            action={
              canManage ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/invoices?client=${client.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
                  >
                    View all
                    <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                  <Button size="sm" onClick={() => setNewInvoice(true)}>
                    <Plus aria-hidden className="h-4 w-4" />
                    New invoice
                  </Button>
                </div>
              ) : undefined
            }
          />

          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Create an invoice to start tracking this client's billing."
            />
          ) : (
            <ul className="divide-y divide-line">
              {invoices.slice(0, 5).map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-medium tabular-nums text-foreground transition-colors hover:text-primary-bright">
                      {invoice.invoiceNumber}
                    </p>
                    {invoice.dueDate ? (
                      <p className="text-xs text-dim">
                        Due {formatDateShort(invoice.dueDate)}
                      </p>
                    ) : null}
                  </Link>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {formatBudget(invoice.total)}
                  </span>
                  <InvoiceStatusBadge status={invoice.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader title="Work history" description="What the team has done for this client" />
        <WorkHistory logs={workLogs} />
      </Panel>

      {editing ? (
        <ClientDialog
          client={client}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : null}

      {newInvoice ? (
        <InvoiceDialog
          invoice={null}
          clients={clients}
          projects={projects}
          preselectedClientId={client.id}
          onClose={() => setNewInvoice(false)}
          onSaved={() => {
            setNewInvoice(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
