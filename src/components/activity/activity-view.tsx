"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity as ActivityIcon,
  CheckSquare,
  FileText,
  FolderKanban,
  Timer,
  Users,
  UsersRound,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { entityHref } from "@/lib/activity/routes";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ActivityEntityType, ActivityEvent } from "@/types";

const filters: { label: string; value?: ActivityEntityType }[] = [
  { label: "All" },
  { label: "Clients", value: "client" },
  { label: "Projects", value: "project" },
  { label: "Tasks", value: "task" },
  { label: "Invoices", value: "invoice" },
  { label: "Time", value: "time" },
  { label: "Team", value: "member" },
];

const entityIcons: Record<string, LucideIcon> = {
  client: Users,
  project: FolderKanban,
  task: CheckSquare,
  invoice: FileText,
  time: Timer,
  member: UsersRound,
};

export function ActivityView({
  events,
  filter,
  hasMore,
  limit,
}: {
  events: ActivityEvent[];
  filter?: ActivityEntityType;
  hasMore: boolean;
  limit: number;
}) {
  const href = (value?: ActivityEntityType) =>
    `/dashboard/activity${value ? `?filter=${value}` : ""}`;

  const loadMoreHref = `/dashboard/activity${
    filter ? `?filter=${filter}&limit=${limit + 25}` : `?limit=${limit + 25}`
  }`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Activity
        </h1>
        <p className="mt-1 text-sm text-muted">
          Everything that&apos;s happened across your workspace.
        </p>
      </div>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
        {filters.map((item) => {
          const active = filter === item.value;
          return (
            <Link
              key={item.label}
              href={href(item.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-[#05251c]"
                  : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        filter ? (
          <EmptyState
            icon={ActivityIcon}
            title="No matching activity"
            description="Try a different filter."
          />
        ) : (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Your workspace activity will appear here."
          />
        )
      ) : (
        <ol className="relative space-y-6">
          {events.map((event, index) => {
            const Icon = entityIcons[event.entityType] ?? ActivityIcon;
            const link = entityHref(event.entityType, event.entityId);
            const actor = event.actorName ?? "Someone";
            return (
              <li key={event.id} className="relative flex gap-3">
                {index < events.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[15px] top-8 h-[calc(100%-6px)] w-px bg-line"
                  />
                ) : null}
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-muted ring-2 ring-background">
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {link ? (
                      <Link
                        href={link}
                        className="transition-colors hover:text-primary-bright"
                      >
                        {event.title}
                      </Link>
                    ) : (
                      event.title
                    )}
                  </p>
                  {event.description ? (
                    <p className="text-sm leading-relaxed text-muted">
                      <span className="font-medium text-foreground">
                        {actor}
                      </span>{" "}
                      {event.description}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-faint">
                    {formatRelativeTime(event.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button href={loadMoreHref} variant="outline" size="sm">
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
