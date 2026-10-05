import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_EMERALD } from "@/components/dashboard/spotlight";
import {
  ProjectPriorityBadge,
  ProjectStatusBadge,
} from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardProject } from "@/lib/dashboard/queries";
import { formatDateOnlyShort } from "@/lib/format";

export function RecentProjects({
  projects,
  className,
}: {
  projects: DashboardProject[];
  className?: string;
}) {
  return (
    <Panel spotlight spotlightColor={SPOTLIGHT_EMERALD} className={className}>
      <PanelHeader
        title="Recent projects"
        action={
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
          >
            View all
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to start tracking work."
        />
      ) : (
        <ul className="divide-y divide-line">
          {projects.map((project) => {
            const progress =
              project.totalTasks > 0
                ? Math.round((project.completedTasks / project.totalTasks) * 100)
                : 0;
            const initials = (() => {
              const parts = project.name.trim().split(/\s+/).filter(Boolean);
              if (parts.length === 0) return "?";
              if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            })();
            return (
              <li
                key={project.id}
                className="py-3.5 transition-colors first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-3 text-xs font-semibold uppercase text-muted">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-dim">
                        {project.clientName ?? "No client"}
                        {project.dueDate
                          ? ` · Due ${formatDateOnlyShort(project.dueDate)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="mt-3 pl-12">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-dim">
                      {project.completedTasks} of {project.totalTasks} tasks
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {progress}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-bright"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <ProjectPriorityBadge priority={project.priority} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
