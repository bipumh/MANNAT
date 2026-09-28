import Link from "next/link";
import { ArrowUpRight, Activity as ActivityIcon } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityEvent } from "@/types";
import { formatRelativeTime } from "@/lib/format";

function initials(name: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ActivityFeed({
  events,
  className,
}: {
  events: ActivityEvent[];
  className?: string;
}) {
  return (
    <Panel className={className}>
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
        <ol className="relative space-y-5">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-3">
              {index < events.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-8 h-[calc(100%-6px)] w-px bg-line"
                />
              ) : null}
              <Avatar
                initials={initials(event.actorName)}
                className="relative h-8 w-8 text-xs ring-2 ring-surface"
              />
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
          ))}
        </ol>
      )}
    </Panel>
  );
}
