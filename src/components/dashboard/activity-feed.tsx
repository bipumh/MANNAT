import Link from "next/link";
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  CheckSquare,
  FileText,
  FolderKanban,
  Timer,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityEvent } from "@/types";
import { formatRelativeTime } from "@/lib/format";

const entityIcons: Record<string, LucideIcon> = {
  client: Users,
  project: FolderKanban,
  task: CheckSquare,
  invoice: FileText,
  time: Timer,
  member: UsersRound,
};

export function ActivityFeed({
  events,
  className,
}: {
  events: ActivityEvent[];
  className?: string;
}) {
  return (
    <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL} className={className}>
      <PanelHeader
        title="Activity"
        description="Latest changes across your workspace"
        action={
          <Link
            href="/dashboard/activity"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
          >
            View all
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No recent activity"
          description="Changes across your workspace will show up here."
        />
      ) : (
        <ol className="relative space-y-2">
          {events.map((event, index) => {
            const Icon = entityIcons[event.entityType] ?? ActivityIcon;
            return (
              <li
                key={event.id}
                className="relative flex gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/40"
              >
                {index < events.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[23px] top-9 h-[calc(100%-12px)] w-px bg-line"
                  />
                ) : null}
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-muted ring-2 ring-surface">
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="font-medium text-foreground">
                      {event.actorName ?? "Someone"}
                    </span>{" "}
                    {event.description}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    {formatRelativeTime(event.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
