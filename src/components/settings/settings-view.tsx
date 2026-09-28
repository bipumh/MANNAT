"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Building2, Shield, User } from "lucide-react";
import { ProfileSection } from "@/components/settings/profile-section";
import { WorkspaceSection } from "@/components/settings/workspace-section";
import { NotificationSection } from "@/components/settings/notification-section";
import { AccountSection } from "@/components/settings/account-section";
import { cn } from "@/lib/cn";
import type { NotificationPreferences, SessionUser } from "@/types";

type SectionId = "profile" | "workspace" | "notifications" | "account";

const sections: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Shield },
];

export function SettingsView({
  user,
  profile,
  workspace,
  preferences,
}: {
  user: SessionUser;
  profile: { fullName: string };
  workspace: { name: string };
  preferences: NotificationPreferences;
}) {
  const [active, setActive] = useState<SectionId>("profile");
  const canEditWorkspace = user.role === "owner" || user.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted">
          Manage your profile, workspace and notifications.
        </p>
      </div>

      {/* Mobile navigation */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1 lg:hidden">
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-[#05251c]"
                  : "text-muted hover:text-foreground",
              )}
            >
              <section.icon aria-hidden className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr] lg:items-start">
        {/* Desktop navigation */}
        <nav
          aria-label="Settings sections"
          className="hidden lg:flex lg:flex-col lg:gap-1"
        >
          {sections.map((section) => {
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary-bright"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <section.icon aria-hidden className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {active === "profile" ? (
            <ProfileSection
              initialName={profile.fullName}
              email={user.email}
            />
          ) : null}
          {active === "workspace" ? (
            <WorkspaceSection
              initialName={workspace.name}
              canEdit={canEditWorkspace}
            />
          ) : null}
          {active === "notifications" ? (
            <NotificationSection initial={preferences} />
          ) : null}
          {active === "account" ? (
            <AccountSection
              email={user.email}
              role={user.role}
              workspaceName={user.workspaceName}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
