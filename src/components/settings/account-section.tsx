"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { RoleBadge } from "@/components/dashboard/status";
import { logoutAction } from "@/lib/auth/actions";
import type { WorkspaceRole } from "@/types";

export function AccountSection({
  email,
  role,
  workspaceName,
}: {
  email: string;
  role: WorkspaceRole;
  workspaceName: string;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Account"
        description="Your account and current session."
      />

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Email</dt>
          <dd className="truncate font-medium text-foreground">{email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Role</dt>
          <dd>
            <RoleBadge role={role} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Workspace</dt>
          <dd className="truncate font-medium text-foreground">
            {workspaceName}
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-line pt-5">
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut aria-hidden className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </Panel>
  );
}
