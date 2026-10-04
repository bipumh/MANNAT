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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { Select } from "@/components/ui/field";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/dashboard/status";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  archiveTaskAction,
  assignTaskAction,
  completeTaskAction,
  reopenTaskAction,
} from "@/lib/tasks/actions";
import { formatDate } from "@/lib/format";
import type { Project, Task, WorkspaceMember } from "@/types";

export function TaskDetail({
  task,
  projects,
  members,
  canManage,
}: {
  task: Task;
  projects: Project[];
  members: WorkspaceMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

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

  function archive() {
    setConfirm(true);
  }

  async function confirmArchive() {
    setBusy(true);
    await archiveTaskAction(task.id);
    setBusy(false);
    setConfirm(false);
    router.refresh();
  }

  async function changeAssignee(userId: string) {
    setBusy(true);
    await assignTaskAction(task.id, userId || null);
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
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard/tasks"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Tasks
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1
                className={
                  isCompleted
                    ? "font-display text-3xl font-semibold tracking-tight text-dim line-through sm:text-4xl"
                    : "font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
                }
              >
                {task.title}
              </h1>
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
      </div>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
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
          <div>
            <p className="text-xs text-faint">Assigned to</p>
            {canManage ? (
              <Select
                aria-label="Assigned to"
                value={task.assigneeUserId ?? ""}
                onChange={(event) => changeAssignee(event.target.value)}
                disabled={busy}
                className="mt-1"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="mt-1 text-sm font-medium text-foreground">
                {task.assigneeName ?? "Unassigned"}
              </p>
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

      {confirm ? (
        <ConfirmDialog
          title="Archive task"
          description={`Archive "${task.title}"? It will be hidden from your task list.`}
          confirmLabel="Archive"
          pending={busy}
          onConfirm={confirmArchive}
          onClose={() => setConfirm(false)}
        />
      ) : null}
    </div>
  );
}
