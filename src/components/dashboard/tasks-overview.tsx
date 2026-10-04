import Link from "next/link";
import { ArrowUpRight, CheckSquare } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardTask } from "@/lib/dashboard/queries";
import { formatDateShort } from "@/lib/format";

export function TasksOverview({
  tasks,
  needsAttention,
  className,
}: {
  tasks: DashboardTask[];
  needsAttention: number;
  className?: string;
}) {
  return (
    <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL} className={className}>
      <PanelHeader
        title="Tasks"
        description={
          needsAttention > 0
            ? `${needsAttention} ${needsAttention === 1 ? "task" : "tasks"} need attention`
            : "No overdue tasks"
        }
        action={
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
          >
            View all
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No open tasks"
          description="You're all caught up."
        />
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
            >
              <Link
                href={`/dashboard/tasks/${task.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium text-foreground transition-colors hover:text-primary-bright">
                  {task.title}
                </p>
                <p className="truncate text-xs text-dim">
                  {task.projectName ?? "No project"}
                  {task.dueDate ? ` · Due ${formatDateShort(task.dueDate)}` : ""}
                </p>
              </Link>
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
