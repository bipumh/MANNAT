"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import {
  ProjectStatusBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
} from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordWorkDialog } from "@/components/work-log/record-work-dialog";
import { WorkHistory } from "@/components/work-log/work-history";
import { formatDateShort, formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MyWorkData } from "@/lib/my-work/queries";
import type { Client, Project, Task } from "@/types";

type TaskFilter = "open" | "completed" | "overdue";

const taskFilters: { label: string; value?: TaskFilter }[] = [
  { label: "All" },
  { label: "Open", value: "open" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" },
];

function isOverdue(task: Task): boolean {
  if (task.status === "completed" || !task.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.dueDate}T00:00:00`) < today;
}

export function MyWorkView({
  data,
  clients,
  projects,
  tasks,
}: {
  data: MyWorkData;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
}) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter | undefined>(undefined);

  const openTasks = data.tasks.filter((t) => t.status !== "completed");
  const overdueTasks = data.tasks.filter(isOverdue);

  const filteredTasks = data.tasks.filter((task) => {
    if (!taskFilter) return true;
    if (taskFilter === "open") return task.status !== "completed";
    if (taskFilter === "completed") return task.status === "completed";
    return isOverdue(task);
  });

  const metrics = [
    { label: "Active projects", value: String(data.projects.length) },
    { label: "Open tasks", value: String(openTasks.length) },
    { label: "Overdue tasks", value: String(overdueTasks.length) },
    {
      label: "Tracked time",
      value: data.trackedMinutes > 0 ? formatDuration(data.trackedMinutes) : "—",
    },
    {
      label: "Billable time",
      value: data.billableMinutes > 0 ? formatDuration(data.billableMinutes) : "—",
    },
  ];

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
              My work
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              My Work
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Your projects, tasks, time, and work history.
            </p>
          </div>
          <Button size="sm" onClick={() => setRecording(true)}>
            <Plus aria-hidden className="h-4 w-4" />
            Record work
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Panel key={metric.label} spotlight spotlightColor={SPOTLIGHT_NEUTRAL} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-dim">
              {metric.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
              {metric.value}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="My projects"
            description="Projects you're assigned to"
            action={
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
              >
                All projects
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {data.projects.length === 0 ? (
            <EmptyState
              title="No assigned projects"
              description="You'll see projects here once an owner or admin assigns you."
            />
          ) : (
            <ul className="divide-y divide-line">
              {data.projects.map((project) => (
                <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground transition-colors hover:text-primary-bright">
                        {project.name}
                      </p>
                      <p className="truncate text-xs text-dim">
                        {project.clientName ?? "No client"}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="My tasks"
            description="Tasks assigned to you"
            action={
              <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
                {taskFilters.map((filter) => {
                  const active = taskFilter === filter.value;
                  return (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={() => setTaskFilter(filter.value)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-[#05251c]"
                          : "text-muted hover:text-foreground",
                      )}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            }
          />
          {filteredTasks.length === 0 ? (
            <EmptyState
              title="No assigned tasks"
              description="Tasks assigned to you will appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {filteredTasks.map((task) => (
                <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate font-medium text-foreground transition-colors hover:text-primary-bright",
                          task.status === "completed" && "text-dim line-through",
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="truncate text-xs text-dim">
                        {task.projectName ?? "No project"}
                        {task.dueDate ? ` · Due ${formatDateShort(task.dueDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <TaskPriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader title="Work history" description="Work you've recorded" />
          <WorkHistory logs={data.workLogs} />
        </Panel>

        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="My time"
            description="Your tracked time"
            action={
              <Link
                href="/dashboard/time"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
              >
                All time
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-surface-2/50 px-4 py-3 text-sm">
            <span className="text-muted">Billable</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatDuration(data.billableMinutes)}
            </span>
            <span className="text-muted">Total</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatDuration(data.trackedMinutes)}
            </span>
          </div>
          {data.timeEntries.length === 0 ? (
            <p className="text-sm text-dim">No time recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.timeEntries.slice(0, 8).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.projectName ?? "Project"}
                    </p>
                    <p className="truncate text-xs text-dim">
                      {formatDateShort(entry.date)}
                      {entry.taskTitle ? ` · ${entry.taskTitle}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatDuration(entry.durationMinutes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {recording ? (
        <RecordWorkDialog
          clients={clients}
          projects={projects}
          tasks={tasks}
          onClose={() => setRecording(false)}
          onSaved={() => {
            setRecording(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
