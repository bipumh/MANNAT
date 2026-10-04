"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { entityHref } from "@/lib/activity/routes";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/use-focus-trap";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import type { Notification } from "@/types";

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function openNotification(notification: Notification) {
    setBusy(true);
    if (!notification.readAt) {
      await markNotificationReadAction(notification.id);
    }
    const href = entityHref(notification.entityType, notification.entityId);
    setBusy(false);
    setOpen(false);
    if (href) router.push(href);
    router.refresh();
  }

  async function markAll() {
    setBusy(true);
    await markAllNotificationsReadAction();
    setBusy(false);
    router.refresh();
  }

  const badge =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong text-muted transition-colors hover:text-foreground"
      >
        <Bell aria-hidden className="h-5 w-5" />
        {badge ? (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-[#05251c] ring-2 ring-background"
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-4 top-16 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lift sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-96"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <span className="font-display text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAll}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-bright disabled:opacity-50"
              >
                <CheckCheck aria-hidden className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-xs text-dim">No new notifications.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const unread = notification.readAt === null;
                return (
                  <li key={notification.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      disabled={busy}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 disabled:opacity-60",
                        unread && "bg-surface-2/40",
                      )}
                    >
                      {unread ? (
                        <span className="sr-only">Unread</span>
                      ) : null}
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          unread ? "bg-primary" : "bg-line-strong",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {notification.title}
                        </span>
                        {notification.message ? (
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                            {notification.message}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-[11px] text-faint">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
