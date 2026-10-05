"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { Panel } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { ProjectPriorityBadge, ProjectStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { archiveProjectAction } from "@/lib/projects/actions";
import { formatBudget, formatDate, formatDateOnlyShort } from "@/lib/format";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProjectsView({
  projects,
  clients,
  query,
  status,
  priority,
  canManage,
}: {
  projects: Project[];
  clients: Client[];
  query: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [dialog, setDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Project | null>(null);

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

  function archive(project: Project) {
    setConfirm(project);
  }

  async function confirmArchive() {
    if (!confirm) return;
    setArchiving(confirm.id);
    await archiveProjectAction(confirm.id);
    setArchiving(null);
    setConfirm(null);
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
    <div className="space-y-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Portfolio
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Projects
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Organize client work, deadlines, and progress in one place.
            </p>
          </div>
          {canManage ? (
            <Button size="sm" onClick={openCreate}>
              <Plus aria-hidden className="h-4 w-4" />
              New project
            </Button>
          ) : null}
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
            placeholder="Search projects or clients…"
            aria-label="Search projects"
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

      <Toast message={notice} />

      {clients.length === 0 ? (        <EmptyState
          title="Add a client first"
          description="Projects are connected to clients, so create your first client before starting a project."
          action={
            canManage ? (
              <Button href="/dashboard/clients">
                <Plus aria-hidden className="h-4 w-4" />
                Add client
              </Button>
            ) : undefined
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
            description={
              canManage
                ? "Create a project and connect it to one of your clients."
                : "Projects you're assigned to will appear here."
            }
            action={
              canManage ? (
                <Button onClick={openCreate}>
                  <Plus aria-hidden className="h-4 w-4" />
                  New project
                </Button>
              ) : undefined
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
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Budget</th>
                  {canManage ? (
                    <th className="px-4 py-3 text-right">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="group transition-colors hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar
                          initials={initials(project.name)}
                          className="h-9 w-9 text-xs"
                        />
                        <span className="min-w-0">
                          <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary-bright">
                            {project.name}
                          </p>
                          <p className="truncate text-xs text-dim">
                            {project.clientCompany
                              ? `${project.clientName} · ${project.clientCompany}`
                              : project.clientName}
                          </p>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ProjectPriorityBadge priority={project.priority} />
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {project.dueDate
                        ? formatDateOnlyShort(project.dueDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {formatBudget(project.budget)}
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
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
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {projects.map((project) => (
              <Panel
                key={project.id}
                spotlight
                spotlightColor={SPOTLIGHT_NEUTRAL}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar
                      initials={initials(project.name)}
                      className="h-10 w-10 text-xs"
                    />
                    <span className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {project.name}
                      </p>
                      <p className="truncate text-xs text-dim">
                        {project.clientCompany
                          ? `${project.clientName} · ${project.clientCompany}`
                          : project.clientName}
                      </p>
                    </span>
                  </Link>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ProjectPriorityBadge priority={project.priority} />
                  {project.dueDate ? (
                    <span className="text-xs text-dim">
                      Due {formatDateOnlyShort(project.dueDate)}
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
                  {canManage ? (
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
                  ) : null}
                </div>
              </Panel>
            ))}
          </div>
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

      {confirm ? (
        <ConfirmDialog
          title="Archive project"
          description={`Archive "${confirm.name}"? It will be hidden from your active project list.`}
          confirmLabel="Archive"
          pending={archiving === confirm.id}
          onConfirm={confirmArchive}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
