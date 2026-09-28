"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { RoleBadge } from "@/components/dashboard/status";
import { MemberDialog } from "@/components/team/member-dialog";
import {
  cancelInvitationAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/team/actions";
import { formatDate, formatDateShort, formatRelativeDate } from "@/lib/format";
import type { TeamInvitation, TeamRole, WorkspaceMember, WorkspaceRole } from "@/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamView({
  members,
  invitations,
  currentUser,
}: {
  members: WorkspaceMember[];
  invitations: TeamInvitation[];
  currentUser: { id: string; role: WorkspaceRole };
}) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage =
    currentUser.role === "owner" || currentUser.role === "admin";

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  function canChangeRole(member: WorkspaceMember): boolean {
    if (!canManage) return false;
    if (member.role === "owner") return false;
    if (currentUser.role === "admin" && member.role === "admin") return false;
    return true;
  }

  function canRemove(member: WorkspaceMember): boolean {
    if (!canManage) return false;
    if (member.role === "owner") return false;
    if (member.userId === currentUser.id) return false;
    if (currentUser.role === "admin" && member.role === "admin") return false;
    return true;
  }

  async function changeRole(member: WorkspaceMember, role: TeamRole) {
    setBusyId(member.id);
    const result = await updateMemberRoleAction(member.id, role);
    setBusyId(null);
    if (result.error) setNotice(result.error);
    router.refresh();
  }

  async function remove(member: WorkspaceMember) {
    if (
      !window.confirm(
        `Remove ${member.fullName} from this workspace?`,
      )
    ) {
      return;
    }
    setBusyId(member.id);
    const result = await removeMemberAction(member.id);
    setBusyId(null);
    if (result.error) setNotice(result.error);
    router.refresh();
  }

  async function revoke(invitation: TeamInvitation) {
    setBusyId(invitation.id);
    const result = await cancelInvitationAction(invitation.id);
    setBusyId(null);
    if (result.error) setNotice(result.error);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Team
          </h2>
          <p className="mt-1 text-sm text-muted">
            {members.length}{" "}
            {members.length === 1 ? "member" : "members"} in your workspace.
          </p>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setInviting(true)}>
            <UserPlus aria-hidden className="h-4 w-4" />
            Invite member
          </Button>
        ) : null}
      </div>

      {notice ? (
        <p className="text-sm text-red-300" role="status">
          {notice}
        </p>
      ) : null}

      <Panel>
        <PanelHeader title="Members" />

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-line bg-surface-2/40 md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium text-dim">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((member) => {
                const isSelf = member.userId === currentUser.id;
                return (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials(member.fullName)} className="h-8 w-8 text-xs" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {member.fullName}
                            {isSelf ? (
                              <span className="ml-2 text-xs font-normal text-dim">
                                You
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {member.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {canChangeRole(member) ? (
                        <select
                          aria-label={`Role for ${member.fullName}`}
                          value={member.role}
                          onChange={(event) =>
                            changeRole(member, event.target.value as TeamRole)
                          }
                          disabled={busyId === member.id}
                          className="h-8 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 pr-7 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" dot>
                        Active
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {canRemove(member) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(member)}
                            disabled={busyId === member.id}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                            Remove
                          </Button>
                        ) : (
                          <span aria-hidden className="w-8" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {members.map((member) => {
            const isSelf = member.userId === currentUser.id;
            return (
              <li
                key={member.id}
                className="rounded-xl border border-line bg-surface-2/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar initials={initials(member.fullName)} className="h-9 w-9 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {member.fullName}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-dim">
                          You
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-dim">
                      {member.email ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {canChangeRole(member) ? (
                    <select
                      aria-label={`Role for ${member.fullName}`}
                      value={member.role}
                      onChange={(event) =>
                        changeRole(member, event.target.value as TeamRole)
                      }
                      disabled={busyId === member.id}
                      className="h-8 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 pr-7 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                  <Badge variant="success" dot>
                    Active
                  </Badge>
                  <span className="text-xs text-dim">
                    Joined {formatDateShort(member.createdAt)}
                  </span>
                </div>

                {canRemove(member) ? (
                  <div className="mt-3 flex justify-end border-t border-line pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(member)}
                      disabled={busyId === member.id}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      {canManage ? (
        <Panel>
          <PanelHeader
            title="Pending invitations"
            description="Share the invite link with your teammates. No email is sent in this phase."
          />

          {invitations.length === 0 ? (
            <p className="text-sm text-dim">No pending invitations.</p>
          ) : (
            <ul className="divide-y divide-line">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-dim">
                      {invitation.role === "admin" ? "Admin" : "Member"} ·{" "}
                      {invitation.inviterName
                        ? `invited by ${invitation.inviterName}`
                        : "invited"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-dim">
                      Expires {formatRelativeDate(invitation.expiresAt)}
                    </span>
                    <RoleBadge role={invitation.role} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revoke(invitation)}
                      disabled={busyId === invitation.id}
                      aria-label={`Revoke invitation for ${invitation.email}`}
                    >
                      <X aria-hidden className="h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {inviting ? (
        <MemberDialog
          onClose={() => setInviting(false)}
          onSaved={() => {
            setInviting(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
