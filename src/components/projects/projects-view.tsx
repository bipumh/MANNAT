"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPriorityBadge, ProjectStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { archiveProjectAction } from "@/lib/projects/actions";
import { formatBudget, formatDate, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Client, Project, ProjectPriority, ProjectStatus } from "@/types";

const statusFilters: { label: string; value?: ProjectStatus }[] = [
  { label: "All" },
  { label: "Planned", value: "planned" },
  { label: "In progress", value: "in_progress" },
  { label: "On hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
];

const priorityFilters: { label: string; value?: ProjectPriority }[] = [
  { label: "All" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export function ProjectsView({
  projects,
  clients,
  query,
  status,
  priority,
}: {
  projects: Project[];
  clients: Client[];
  query: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [dialog, setDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (search === query) return;
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const qs = params.toString();
      router.replace(`/dashboard/projects${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(id);
  }, [search, query, status, priority, router]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  function openCreate() {
    setDialog({ open: true, project: null });
  }

  function openEdit(project: Project) {
    setDialog({ open: true, project });
  }

  function onSaved() {
    setDialog({ open: false, project: null });
    setNotice("Project saved");
    router.refresh();
  }

  async function archive(project: Project) {
    if (!window.confirm(`Archive "${project.name}"?`)) return;
    setArchiving(project.id);
    await archiveProjectAction(project.id);
    setArchiving(null);
    setNotice("Project archived");
    router.refresh();
  }

  const href = (opts: { status?: ProjectStatus; priority?: ProjectPriority }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (opts.status) params.set("status", opts.status);
    if (opts.priority) params.set("priority", opts.priority);
    const qs = params.toString();
    return `/dashboard/projects${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h2>
          <p className="mt-1 text-sm text-muted">
            Organize client work, deadlines, and progress in one place.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus aria-hidden className="h-4 w-4" />
          New project
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
            placeholder="Search projects or clients…"
            aria-label="Search projects"
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
        </div>
      </div>

      {notice ? (
        <p className="text-sm text-primary-bright" role="status">
          {notice}
        </p>
      ) : null}

      {clients.length === 0 ? (
        <EmptyState
          title="Add a client first"
          description="Projects are connected to clients, so create your first client before starting a project."
          action={
            <Button href="/dashboard/clients">
              <Plus aria-hidden className="h-4 w-4" />
              Add client
            </Button>
          }
        />
      ) : projects.length === 0 ? (
        query || status || priority ? (
          <EmptyState
            title="No matching projects"
            description="Try a different search or filter."
          />
        ) : (
          <EmptyState
            title="No projects yet"
            description="Create a project and connect it to one of your clients."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden className="h-4 w-4" />
                New project
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
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="group transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="block"
                      >
                        <p className="font-medium text-foreground transition-colors group-hover:text-primary-bright">
                          {project.name}
                        </p>
                        <p className="text-xs text-dim">
                          {project.clientCompany
                            ? `${project.clientName} · ${project.clientCompany}`
                            : project.clientName}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ProjectPriorityBadge priority={project.priority} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {project.dueDate
                        ? formatDateShort(project.dueDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatBudget(project.budget)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archive(project)}
                          disabled={archiving === project.id}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="min-w-0"
                  >
                    <p className="truncate font-medium text-foreground">
                      {project.name}
                    </p>
                    <p className="truncate text-xs text-dim">
                      {project.clientCompany
                        ? `${project.clientName} · ${project.clientCompany}`
                        : project.clientName}
                    </p>
                  </Link>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ProjectPriorityBadge priority={project.priority} />
                  {project.dueDate ? (
                    <span className="text-xs text-dim">
                      Due {formatDateShort(project.dueDate)}
                    </span>
                  ) : null}
                  {project.budget ? (
                    <span className="text-xs text-muted">
                      {formatBudget(project.budget)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-xs text-dim">
                    Added {formatDate(project.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(project)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archive(project)}
                      disabled={archiving === project.id}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {dialog.open ? (
        <ProjectDialog
          project={dialog.project}
          clients={clients}
          onClose={() => setDialog({ open: false, project: null })}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
