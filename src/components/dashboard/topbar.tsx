"use client";

import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { Notification, SessionUser } from "@/types";

function pageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Overview";
  if (pathname.startsWith("/dashboard/clients")) return "Clients";
  if (pathname.startsWith("/dashboard/projects")) return "Projects";
  if (pathname.startsWith("/dashboard/tasks")) return "Tasks";
  if (pathname.startsWith("/dashboard/invoices")) return "Invoices";
  if (pathname.startsWith("/dashboard/time")) return "Time";
  if (pathname.startsWith("/dashboard/team")) return "Team";
  if (pathname.startsWith("/dashboard/activity")) return "Activity";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Overview";
}

export function Topbar({
  user,
  onMenuClick,
  notifications,
  unreadCount,
  title,
}: {
  user: SessionUser;
  onMenuClick: () => void;
  notifications: Notification[];
  unreadCount: number;
  title?: string;
}) {
  const pathname = usePathname();
  const resolvedTitle = title ?? pageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-background/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong text-muted lg:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="hidden truncate text-muted sm:inline">
          {user.workspaceName}
        </span>
        <span aria-hidden className="hidden text-faint sm:inline">
          /
        </span>
        <span className="truncate font-display font-semibold text-foreground">
          {resolvedTitle}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 py-2 md:flex">
          <Search aria-hidden className="h-4 w-4 text-faint" />
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="w-44 bg-transparent text-sm text-foreground placeholder:text-faint focus:outline-none"
          />
          <kbd className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-faint">
            ⌘K
          </kbd>
        </div>

        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
        />

        <Avatar
          initials={user.initials}
          tone="primary"
          className="h-9 w-9 text-sm"
        />
      </div>
    </header>
  );
}
