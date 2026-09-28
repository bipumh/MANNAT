"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  CheckSquare,
  ChevronsUpDown,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
  Users,
  UsersRound,
} from "lucide-react";
import { BrandTile } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser, WorkspaceRole } from "@/types";
import { cn } from "@/lib/cn";

type NavItem = { label: string; href: string; icon: LucideIcon; count?: number };
type NavSection = { label?: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Activity", href: "/dashboard/activity", icon: Activity },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Clients", href: "/dashboard/clients", icon: Users },
      { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
      { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, count: 5 },
      { label: "Time", href: "/dashboard/time", icon: Timer },
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText, count: 7 },
      { label: "Team", href: "/dashboard/team", icon: UsersRound },
    ],
  },
];

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function SidebarContent({
  user,
  onNavigate,
}: {
  user: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-2 p-2 text-left transition-colors hover:bg-surface-3"
        >
          <BrandTile className="h-9 w-9" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {user.workspaceName}
            </span>
            <span className="block truncate text-xs text-dim">
              {roleLabels[user.role]}
            </span>
          </span>
          <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-faint" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.label ?? `section-${sectionIndex}`}
            className={cn(sectionIndex > 0 && "mt-6")}
          >
            {section.label ? (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-soft text-primary-bright"
                          : "text-muted hover:bg-surface-2 hover:text-foreground",
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                        />
                      ) : null}
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {item.count ? (
                        <span className="ml-auto rounded-full bg-surface-3 px-1.5 py-0.5 text-[11px] font-medium leading-none text-muted">
                          {item.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <div className="mt-1 flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar initials={user.initials} tone="primary" className="h-9 w-9 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-dim">{roleLabels[user.role]}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <LogOut aria-hidden className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
