"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/types";

export function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(menuRef, open);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex rounded-full ring-offset-2 ring-offset-background transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Avatar
          initials={user.initials}
          tone="primary"
          className="h-9 w-9 text-sm"
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-dim">{user.email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Settings aria-hidden className="h-4 w-4" />
              Settings
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <LogOut aria-hidden className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
