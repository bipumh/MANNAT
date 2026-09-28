import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import {
  ProjectPriorityBadge,
  ProjectStatusBadge,
} from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardProject } from "@/lib/dashboard/queries";
import { formatDateShort } from "@/lib/format";

export function RecentProjects({
  projects,
  className,
}: {
  projects: DashboardProject[];
  className?: string;
}) {
  return (
    <Panel className={className}>
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
            return (
              <li
                key={project.id}
                className="-mx-2 rounded-lg px-2 py-3.5 transition-colors first:pt-0 last:pb-0 hover:bg-surface-2/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {project.name}
                    </p>
                    <p className="mt-0.5 text-xs text-dim">
                      {project.clientName ?? "No client"}
                      {project.dueDate
                        ? ` · Due ${formatDateShort(project.dueDate)}`
                        : ""}
                    </p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs tabular-nums text-muted">
                    {progress}%
                  </span>
                  <ProjectPriorityBadge priority={project.priority} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
