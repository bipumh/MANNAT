"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/dashboard/status";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  archiveTaskAction,
  completeTaskAction,
  reopenTaskAction,
} from "@/lib/tasks/actions";
import { formatDate } from "@/lib/format";
import type { Project, Task } from "@/types";

export function TaskDetail({
  task,
  projects,
}: {
  task: Task;
  projects: Project[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isCompleted = task.status === "completed";
  const clientLabel = task.clientCompany
    ? `${task.clientName} — ${task.clientCompany}`
    : task.clientName;

  async function toggleComplete() {
    setBusy(true);
    if (isCompleted) {
      await reopenTaskAction(task.id);
    } else {
      await completeTaskAction(task.id);
    }
    setBusy(false);
    router.refresh();
  }

  async function archive() {
    if (!window.confirm(`Archive "${task.title}"?`)) return;
    setBusy(true);
    await archiveTaskAction(task.id);
    setBusy(false);
    router.refresh();
  }

  const facts = [
    { label: "Due date", value: task.dueDate ? formatDate(task.dueDate) : "—" },
    { label: "Created", value: formatDate(task.createdAt) },
    ...(task.completedAt
      ? [{ label: "Completed", value: formatDate(task.completedAt) }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Tasks
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2
              className={
                isCompleted
                  ? "font-display text-2xl font-semibold tracking-tight text-dim line-through"
                  : "font-display text-2xl font-semibold tracking-tight text-foreground"
              }
            >
              {task.title}
            </h2>
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="surface" onClick={() => setEditing(true)}>
            <Pencil aria-hidden className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm" onClick={toggleComplete} disabled={busy}>
            {isCompleted ? (
              <RotateCcw aria-hidden className="h-4 w-4" />
            ) : (
              <Check aria-hidden className="h-4 w-4" />
            )}
            {isCompleted ? "Reopen" : "Complete"}
          </Button>
          <Button size="sm" variant="ghost" onClick={archive} disabled={busy}>
            <Trash2 aria-hidden className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      <Panel>
        <PanelHeader title="Details" />
        {task.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {task.description}
          </p>
        ) : (
          <p className="text-sm text-dim">No description.</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-faint">Project</p>
            <Link
              href={`/dashboard/projects/${task.projectId}`}
              className="mt-1 inline-block text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
            >
              {task.projectName}
            </Link>
          </div>
          <div>
            <p className="text-xs text-faint">Client</p>
            {task.clientId ? (
              <Link
                href={`/dashboard/clients/${task.clientId}`}
                className="mt-1 inline-block text-sm font-medium text-foreground transition-colors hover:text-primary-bright"
              >
                {clientLabel}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-foreground">—</p>
            )}
          </div>
          {facts.map((fact) => (
            <div key={fact.label}>
              <p className="text-xs text-faint">{fact.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {fact.value}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {editing ? (
        <TaskDialog
          task={task}
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
