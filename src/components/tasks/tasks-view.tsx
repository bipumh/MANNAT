"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  archiveTaskAction,
  completeTaskAction,
  reopenTaskAction,
} from "@/lib/tasks/actions";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Project, Task, TaskPriority, TaskStatus } from "@/types";

const statusFilters: { label: string; value?: TaskStatus }[] = [
  { label: "All" },
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

const priorityFilters: { label: string; value?: TaskPriority }[] = [
  { label: "All" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

function dueMeta(
  dueDate: string | null,
  status: TaskStatus,
): { label: string; className: string } | null {
  if (!dueDate) return null;
  if (status === "completed") {
    return { label: formatDateShort(dueDate), className: "text-dim" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) {
    return { label: `Overdue · ${formatDateShort(dueDate)}`, className: "text-red-300" };
  }
  if (days === 0) return { label: "Due today", className: "text-amber-300" };
  if (days === 1) return { label: "Due tomorrow", className: "text-amber-300" };
  return { label: formatDateShort(dueDate), className: "text-muted" };
}

export function TasksView({
  tasks,
  projects,
  query,
  status,
  priority,
  projectId,
}: {
  tasks: Task[];
  projects: Project[];
  query: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (search === query) return;
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (projectId) params.set("project", projectId);
      const qs = params.toString();
      router.replace(`/dashboard/tasks${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(id);
  }, [search, query, status, priority, projectId, router]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  function openCreate() {
    setDialog({ open: true, task: null });
  }

  function openEdit(task: Task) {
    setDialog({ open: true, task });
  }

  function onSaved() {
    setDialog({ open: false, task: null });
    setNotice("Task saved");
    router.refresh();
  }

  async function toggleComplete(task: Task) {
    setBusyId(task.id);
    if (task.status === "completed") {
      await reopenTaskAction(task.id);
    } else {
      await completeTaskAction(task.id);
    }
    setBusyId(null);
    router.refresh();
  }

  async function archive(task: Task) {
    if (!window.confirm(`Archive "${task.title}"?`)) return;
    setBusyId(task.id);
    await archiveTaskAction(task.id);
    setBusyId(null);
    setNotice("Task archived");
    router.refresh();
  }

  const href = (opts: { status?: TaskStatus; priority?: TaskPriority }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (opts.status) params.set("status", opts.status);
    if (opts.priority) params.set("priority", opts.priority);
    if (projectId) params.set("project", projectId);
    const qs = params.toString();
    return `/dashboard/tasks${qs ? `?${qs}` : ""}`;
  };

  function onProjectChange(value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (value) params.set("project", value);
    const qs = params.toString();
    router.push(`/dashboard/tasks${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Tasks
          </h2>
          <p className="mt-1 text-sm text-muted">
            Track the work behind your projects, one task at a time.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus aria-hidden className="h-4 w-4" />
          New task
        </Button>
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
            placeholder="Search tasks or projects…"
            aria-label="Search tasks"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
            {statusFilters.map((filter) => {
              const active = status === filter.value;
              return (
                <Link
                  key={filter.label}
                  href={href({ status: filter.value, priority })}
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

          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
            {priorityFilters.map((filter) => {
              const active = priority === filter.value;
              return (
                <Link
                  key={filter.label}
                  href={href({ status, priority: filter.value })}
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
            onChange={(event) => onProjectChange(event.target.value)}
            className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
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

      {notice ? (
        <p className="text-sm text-primary-bright" role="status">
          {notice}
        </p>
      ) : null}

      {projects.length === 0 ? (
        <EmptyState
          title="Create a project first"
          description="Tasks must belong to a project, so create a project before adding tasks."
          action={
            <Button href="/dashboard/projects">
              <Plus aria-hidden className="h-4 w-4" />
              Go to projects
            </Button>
          }
        />
      ) : tasks.length === 0 ? (
        query || status || priority || projectId ? (
          <EmptyState
            title="No matching tasks"
            description="Try a different search or filter."
          />
        ) : (
          <EmptyState
            title="No tasks yet"
            description="Create your first task to start tracking project work."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden className="h-4 w-4" />
                New task
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-dim">
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">Complete</span>
                  </th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tasks.map((task) => {
                  const due = dueMeta(task.dueDate, task.status);
                  return (
                    <tr
                      key={task.id}
                      className="group transition-colors hover:bg-surface-2/50"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleComplete(task)}
                          disabled={busyId === task.id}
                          aria-label={
                            task.status === "completed"
                              ? "Reopen task"
                              : "Mark task complete"
                          }
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                            task.status === "completed"
                              ? "border-primary bg-primary text-[#05251c]"
                              : "border-line-strong hover:border-primary",
                          )}
                        >
                          {task.status === "completed" ? (
                            <Check aria-hidden className="h-3.5 w-3.5" />
                          ) : null}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/tasks/${task.id}`}
                          className="block"
                        >
                          <p
                            className={cn(
                              "font-medium text-foreground transition-colors group-hover:text-primary-bright",
                              task.status === "completed" &&
                                "text-dim line-through",
                            )}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-dim">{task.projectName}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className={cn("px-4 py-3 text-sm", due?.className)}>
                        {due?.label ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(task)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archive(task)}
                            disabled={busyId === task.id}
                          >
                            Archive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {tasks.map((task) => {
              const due = dueMeta(task.dueDate, task.status);
              return (
                <li
                  key={task.id}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleComplete(task)}
                      disabled={busyId === task.id}
                      aria-label={
                        task.status === "completed"
                          ? "Reopen task"
                          : "Mark task complete"
                      }
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        task.status === "completed"
                          ? "border-primary bg-primary text-[#05251c]"
                          : "border-line-strong hover:border-primary",
                      )}
                    >
                      {task.status === "completed" ? (
                        <Check aria-hidden className="h-3.5 w-3.5" />
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/tasks/${task.id}`}>
                        <p
                          className={cn(
                            "truncate font-medium text-foreground",
                            task.status === "completed" && "text-dim line-through",
                          )}
                        >
                          {task.title}
                        </p>
                      </Link>
                      <p className="truncate text-xs text-dim">
                        {task.projectName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                    {due ? (
                      <span className={cn("text-xs", due.className)}>
                        {due.label}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-line pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(task)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archive(task)}
                      disabled={busyId === task.id}
                    >
                      Archive
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {dialog.open ? (
        <TaskDialog
          task={dialog.task}
          projects={projects}
          onClose={() => setDialog({ open: false, task: null })}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
