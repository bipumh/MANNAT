"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { Notification, SessionUser } from "@/types";

export function DashboardShell({
  user,
  notifications,
  unreadCount,
  children,
}: {
  user: SessionUser;
  notifications: Notification[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent user={user} />
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-display text-sm font-semibold text-foreground">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong text-muted"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent
                user={user}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
