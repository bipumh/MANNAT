"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { Badge } from "@/components/ui/badge";
import { TimeDialog } from "@/components/time/time-dialog";
import { deleteTimeEntryAction } from "@/lib/time/actions";
import {
  formatCurrencyPrecise,
  formatDate,
  formatDuration,
} from "@/lib/format";
import type { Project, Task, TimeEntry } from "@/types";

function entryAmount(entry: TimeEntry): number | null {
  if (!entry.billable || !entry.hourlyRate) return null;
  const rate = Number(entry.hourlyRate);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return (entry.durationMinutes / 60) * rate;
}

export function TimeDetail({
  entry,
  projects,
  tasks,
}: {
  entry: TimeEntry;
  projects: Project[];
  tasks: Task[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const amount = entryAmount(entry);
  const clientLabel = entry.clientCompany
    ? `${entry.clientName} — ${entry.clientCompany}`
    : entry.clientName;

  async function remove() {
    if (!window.confirm(`Delete this time entry?`)) return;
    setBusy(true);
    await deleteTimeEntryAction(entry.id);
    setBusy(false);
    router.push("/dashboard/time");
    router.refresh();
  }

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
              href="/dashboard/time"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Time
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {formatDate(entry.date)}
              </h1>
              {entry.billable ? (
                <Badge variant="success">Billable</Badge>
              ) : (
                <Badge variant="neutral">Non-billable</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {formatDuration(entry.durationMinutes)}
              {amount !== null
                ? ` · ${formatCurrencyPrecise(amount)}`
                : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="surface" onClick={() => setEditing(true)}>
              <Pencil aria-hidden className="h-4 w-4" />
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
              <Trash2 aria-hidden className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader title="Details" />
        {entry.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {entry.description}
          </p>
        ) : (
          <p className="text-sm text-dim">No description.</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-faint">Project</p>
            <Link
              href={`/dashboard/projects/${entry.projectId}`}
              className="mt-1 inline-block text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
            >
              {entry.projectName}
            </Link>
          </div>
          <div>
            <p className="text-xs text-faint">Task</p>
            {entry.taskId && entry.taskTitle ? (
              <Link
                href={`/dashboard/tasks/${entry.taskId}`}
                className="mt-1 inline-block text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
              >
                {entry.taskTitle}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-foreground">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-faint">Client</p>
            {entry.clientId ? (
              <Link
                href={`/dashboard/clients/${entry.clientId}`}
                className="mt-1 inline-block text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
              >
                {clientLabel}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-foreground">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-faint">Duration</p>
            <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
              {formatDuration(entry.durationMinutes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-faint">Hourly rate</p>
            <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
              {entry.hourlyRate ? formatCurrencyPrecise(Number(entry.hourlyRate)) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-faint">Amount</p>
            <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
              {amount !== null ? formatCurrencyPrecise(amount) : "—"}
            </p>
          </div>
        </div>
      </Panel>

      {editing ? (
        <TimeDialog
          entry={entry}
          projects={projects}
          tasks={tasks}
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
