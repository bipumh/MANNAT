"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/field";
import { RoleBadge } from "@/components/dashboard/status";
import { setProjectMembersAction } from "@/lib/projects/actions";
import type { WorkspaceMember } from "@/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProjectTeam({
  projectId,
  assigned,
  allMembers,
  canManage,
}: {
  projectId: string;
  assigned: WorkspaceMember[];
  allMembers: WorkspaceMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");

  const assignedUserIds = useMemo(
    () => new Set(assigned.map((m) => m.userId)),
    [assigned],
  );
  const available = allMembers.filter((m) => !assignedUserIds.has(m.userId));

  async function update(userIds: string[]) {
    setBusy(true);
    const result = await setProjectMembersAction(projectId, userIds);
    setBusy(false);
    if (!result.ok) {
      return;
    }
    router.refresh();
  }

  function add() {
    if (!selected) return;
    update([...assigned.map((m) => m.userId), selected]);
    setSelected("");
  }

  function remove(userId: string) {
    update(assigned.map((m) => m.userId).filter((id) => id !== userId));
  }

  if (!canManage) {
    if (assigned.length === 0) {
      return <p className="text-sm text-dim">No team members assigned.</p>;
    }
    return (
      <ul className="space-y-2.5">
        {assigned.map((member) => (
          <li key={member.id} className="flex items-center gap-3">
            <Avatar initials={initials(member.fullName)} className="h-8 w-8 text-xs" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {member.fullName}
              </span>
              <span className="block truncate text-xs text-dim">{member.email}</span>
            </span>
            <RoleBadge role={member.role} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      {assigned.length > 0 ? (
        <ul className="space-y-2.5">
          {assigned.map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <Avatar initials={initials(member.fullName)} className="h-8 w-8 text-xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {member.fullName}
                </span>
                <span className="block truncate text-xs text-dim">{member.email}</span>
              </span>
              <RoleBadge role={member.role} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(member.userId)}
                disabled={busy}
                aria-label={`Remove ${member.fullName}`}
              >
                <X aria-hidden className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-dim">No team members assigned yet.</p>
      )}

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Select
          aria-label="Add member"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="flex-1"
        >
          <option value="" disabled>
            Add a member…
          </option>
          {available.map((member) => (
            <option key={member.id} value={member.userId}>
              {member.fullName}
            </option>
          ))}
        </Select>
        <Button size="sm" variant="surface" onClick={add} disabled={!selected || busy}>
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
