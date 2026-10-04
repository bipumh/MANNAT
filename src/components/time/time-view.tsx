"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Search, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { Panel } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeDialog } from "@/components/time/time-dialog";
import { TimeInvoiceDialog } from "@/components/time/time-invoice-dialog";
import { deleteTimeEntryAction } from "@/lib/time/actions";
import {
  formatCurrencyPrecise,
  formatDate,
  formatDateShort,
  formatDuration,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import type { UnbilledProjectSummary } from "@/lib/time/queries";
import type { Project, Task, TimeEntry } from "@/types";

const billableFilters: { label: string; value?: boolean }[] = [
  { label: "All" },
  { label: "Billable", value: true },
  { label: "Non-billable", value: false },
];

function entryAmount(entry: TimeEntry): number | null {
  if (!entry.billable || !entry.hourlyRate) return null;
  const rate = Number(entry.hourlyRate);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return (entry.durationMinutes / 60) * rate;
}

export function TimeView({
  entries,
  projects,
  tasks,
  unbilled,
  query,
  projectId,
  taskId,
  billable,
  canManage,
}: {
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  unbilled: UnbilledProjectSummary[];
  query: string;
  projectId?: string;
  taskId?: string;
  billable?: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [dialog, setDialog] = useState<{ open: boolean; entry: TimeEntry | null }>({
    open: false,
    entry: null,
  });
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<TimeEntry | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (search === query) return;
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (projectId) params.set("project", projectId);
      if (taskId) params.set("task", taskId);
      if (billable !== undefined) params.set("billable", String(billable));
      const qs = params.toString();
      router.replace(`/dashboard/time${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(id);
  }, [search, query, projectId, taskId, billable, router]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  function openCreate() {
    setDialog({ open: true, entry: null });
  }

  function openEdit(entry: TimeEntry) {
    setDialog({ open: true, entry });
  }

  function onSaved() {
    setDialog({ open: false, entry: null });
    setNotice("Time entry saved");
    router.refresh();
  }

  function remove(entry: TimeEntry) {
    setConfirm(entry);
  }

  async function confirmDelete() {
    if (!confirm) return;
    setBusyId(confirm.id);
    await deleteTimeEntryAction(confirm.id);
    setBusyId(null);
    setConfirm(null);
    setNotice("Time entry deleted");
    router.refresh();
  }

  const href = (value?: boolean) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (projectId) params.set("project", projectId);
    if (taskId) params.set("task", taskId);
    if (value !== undefined) params.set("billable", String(value));
    const qs = params.toString();
    return `/dashboard/time${qs ? `?${qs}` : ""}`;
  };

  function navigate(key: string, value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (projectId) params.set("project", projectId);
    if (taskId) params.set("task", taskId);
    if (billable !== undefined) params.set("billable", String(billable));
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(`/dashboard/time${qs ? `?${qs}` : ""}`);
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
              Time
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Time
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Log billable and non-billable hours across your projects.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Button
                size="sm"
                variant="surface"
                onClick={() => setInvoiceOpen(true)}
              >
                <FileText aria-hidden className="h-4 w-4" />
                Invoice time
              </Button>
            ) : null}
            <Button size="sm" onClick={openCreate}>
              <Plus aria-hidden className="h-4 w-4" />
              Log time
            </Button>
          </div>
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
            placeholder="Search time, projects or tasks…"
            aria-label="Search time entries"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
            {billableFilters.map((filter) => {
              const active = billable === filter.value;
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

          <select
            aria-label="Filter by task"
            value={taskId ?? ""}
            onChange={(event) => navigate("task", event.target.value)}
            className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="">All tasks</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Toast message={notice} />

      {projects.length === 0 ? (
        <EmptyState
          title="Create a project first"
          description="Time entries must belong to a project, so create a project before logging time."
          action={
            <Button href="/dashboard/projects">
              <Plus aria-hidden className="h-4 w-4" />
              Go to projects
            </Button>
          }
        />
      ) : entries.length === 0 ? (
        query || projectId || taskId || billable !== undefined ? (
          <EmptyState
            icon={Timer}
            title="No matching entries"
            description="Try a different search or filter."
          />
        ) : (
          <EmptyState
            icon={Timer}
            title="No time logged yet"
            description="Log your first entry to start tracking hours on this project."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden className="h-4 w-4" />
                Log time
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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((entry) => {
                  const amount = entryAmount(entry);
                  return (
                    <tr
                      key={entry.id}
                      className="group transition-colors hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/time/${entry.id}`}
                          className="block"
                        >
                          <p className="font-medium text-foreground transition-colors group-hover:text-primary-bright">
                            {formatDateShort(entry.date)}
                          </p>
                          {entry.description ? (
                            <p className="max-w-[220px] truncate text-xs text-dim">
                              {entry.description}
                            </p>
                          ) : null}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        <p>{entry.projectName}</p>
                        {entry.userName ? (
                          <p className="text-xs text-faint">{entry.userName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {entry.taskTitle ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-foreground">
                        {formatDuration(entry.durationMinutes)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-muted">
                        {amount !== null ? formatCurrencyPrecise(amount) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {entry.billable ? (
                          <Badge variant="success">Billable</Badge>
                        ) : (
                          <Badge variant="neutral">Non-billable</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(entry)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(entry)}
                            disabled={busyId === entry.id}
                          >
                            Delete
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
            {entries.map((entry) => {
              const amount = entryAmount(entry);
              return (
                <Panel
                  key={entry.id}
                  spotlight
                  spotlightColor={SPOTLIGHT_NEUTRAL}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/dashboard/time/${entry.id}`}
                      className="min-w-0"
                    >
                      <p className="font-medium text-foreground">
                        {formatDateShort(entry.date)}
                      </p>
                      <p className="truncate text-xs text-dim">
                        {entry.projectName}
                        {entry.taskTitle ? ` · ${entry.taskTitle}` : ""}
                        {entry.userName ? ` · ${entry.userName}` : ""}
                      </p>
                    </Link>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatDuration(entry.durationMinutes)}
                    </span>
                  </div>

                  {entry.description ? (
                    <p className="mt-2 text-sm text-muted">
                      {entry.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {entry.billable ? (
                      <Badge variant="success">Billable</Badge>
                    ) : (
                      <Badge variant="neutral">Non-billable</Badge>
                    )}
                    {amount !== null ? (
                      <span className="text-xs font-medium tabular-nums text-muted">
                        {formatCurrencyPrecise(amount)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-line pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(entry)}
                      disabled={busyId === entry.id}
                    >
                      Delete
                    </Button>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {dialog.open ? (
        <TimeDialog
          entry={dialog.entry}
          projects={projects}
          tasks={tasks}
          onClose={() => setDialog({ open: false, entry: null })}
          onSaved={onSaved}
        />
      ) : null}

      {invoiceOpen ? (
        <TimeInvoiceDialog
          summaries={unbilled}
          onClose={() => setInvoiceOpen(false)}
          onSaved={() => {
            setInvoiceOpen(false);
            setNotice("Invoice created");
            router.refresh();
          }}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title="Delete time entry"
          description={`Delete this ${formatDate(confirm.date)} entry (${formatDuration(
            confirm.durationMinutes,
          )})? This can't be undone.`}
          confirmLabel="Delete"
          pending={busyId === confirm.id}
          onConfirm={confirmDelete}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
