"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Panel } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { ClientStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientDialog } from "@/components/clients/client-dialog";
import { archiveClientAction } from "@/lib/clients/actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Client, ClientStatus } from "@/types";

const filters: { label: string; value?: ClientStatus }[] = [
  { label: "All" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ClientsView({
  clients,
  query,
  status,
}: {
  clients: Client[];
  query: string;
  status?: ClientStatus;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [dialog, setDialog] = useState<{ open: boolean; client: Client | null }>({
    open: false,
    client: null,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (search === query) return;
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      const qs = params.toString();
      router.replace(`/dashboard/clients${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(id);
  }, [search, query, status, router]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  function openCreate() {
    setDialog({ open: true, client: null });
  }

  function openEdit(client: Client) {
    setDialog({ open: true, client });
  }

  function onSaved() {
    setDialog({ open: false, client: null });
    setNotice("Client saved");
    router.refresh();
  }

  async function archive(client: Client) {
    if (!window.confirm(`Archive "${client.name}"?`)) return;
    setArchiving(client.id);
    await archiveClientAction(client.id);
    setArchiving(null);
    setNotice("Client archived");
    router.refresh();
  }

  const filterHref = (value?: ClientStatus) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (value) params.set("status", value);
    const qs = params.toString();
    return `/dashboard/clients${qs ? `?${qs}` : ""}`;
  };

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
              Directory
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Clients
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Manage your client relationships and keep everything connected.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/clients/health"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
            >
              Client health
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
            <Button size="sm" onClick={openCreate}>
              <Plus aria-hidden className="h-4 w-4" />
              New client
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clients…"
            aria-label="Search clients"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </div>

        <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-line bg-surface p-1">
          {filters.map((filter) => {
            const active = status === filter.value;
            return (
              <Link
                key={filter.label}
                href={filterHref(filter.value)}
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
      </div>

      {notice ? (
        <p className="text-sm text-primary-bright" role="status">
          {notice}
        </p>
      ) : null}

      {clients.length === 0 ? (
        query || status ? (
          <EmptyState
            title="No matching clients"
            description="Try a different search or filter."
          />
        ) : (
          <EmptyState
            title="No clients yet"
            description="Add your first client to start organizing projects, tasks, and invoices in one workspace."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden className="h-4 w-4" />
                Add client
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
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="group transition-colors hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar
                          initials={initials(client.name)}
                          className="h-9 w-9 text-xs"
                        />
                        <span className="min-w-0">
                          <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary-bright">
                            {client.name}
                          </p>
                          {client.company ? (
                            <p className="truncate text-xs text-dim">
                              {client.company}
                            </p>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {client.email ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {client.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <ClientStatusBadge status={client.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(client)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archive(client)}
                          disabled={archiving === client.id}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {clients.map((client) => (
              <Panel
                key={client.id}
                spotlight
                spotlightColor={SPOTLIGHT_NEUTRAL}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar
                      initials={initials(client.name)}
                      className="h-10 w-10 text-xs"
                    />
                    <span className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {client.name}
                      </p>
                      {client.company ? (
                        <p className="truncate text-xs text-dim">
                          {client.company}
                        </p>
                      ) : null}
                      {client.email ? (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {client.email}
                        </p>
                      ) : null}
                    </span>
                  </Link>
                  <ClientStatusBadge status={client.status} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-xs text-dim">
                    Added {formatDate(client.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(client)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archive(client)}
                      disabled={archiving === client.id}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}

      {dialog.open ? (
        <ClientDialog
          client={dialog.client}
          onClose={() => setDialog({ open: false, client: null })}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
