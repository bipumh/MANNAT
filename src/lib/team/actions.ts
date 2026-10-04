"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/activity/log";
import { notifyOwnersAndAdmins, notifyUser } from "@/lib/notifications/notify";
import { sendInvitationEmail } from "@/lib/email/invitation";
import type { SessionUser, TeamRole } from "@/types";

export type TeamActionState = {
  error?: string;
  success?: boolean;
  token?: string;
  inviteUrl?: string;
  emailSent?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function canManage(user: SessionUser): boolean {
  return user.role === "owner" || user.role === "admin";
}

export async function inviteMemberAction(input: {
  email: string;
  role: string;
}): Promise<TeamActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  if (!canManage(user)) {
    return { error: "You don't have permission to invite members." };
  }

  const email = normalizeEmail(input.email);
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const role = input.role as TeamRole;
  if (role !== "admin" && role !== "member") {
    return { error: "Invalid role." };
  }

  const sql = getDb();

  const memberRows = await sql`
    select 1
    from workspace_members wm
    join neon_auth.user u on u.id::text = wm.user_id
    where wm.workspace_id = ${user.workspaceId} and lower(u.email) = ${email}
    limit 1
  `;
  if (memberRows.length > 0) {
    return { error: "This email already belongs to a workspace member." };
  }

  const inviteRows = await sql`
    select 1
    from team_invitations
    where workspace_id = ${user.workspaceId}
      and lower(email) = ${email}
      and accepted_at is null
    limit 1
  `;
  if (inviteRows.length > 0) {
    return { error: "An invitation for this email is already pending." };
  }

  const token = randomBytes(24).toString("hex");
  const inviteUrl = `/invite/${token}`;

  try {
    await sql`
      insert into team_invitations (
        workspace_id, email, role, token, invited_by, expires_at
      )
      values (
        ${user.workspaceId},
        ${email},
        ${role},
        ${token},
        ${user.id},
        now() + interval '7 days'
      )
    `;
  } catch (err) {
    console.error("[mannat] invite member failed:", err);
    return { error: "Could not create the invitation. Please try again." };
  }

  // Send the invitation email when configured. Best-effort and optional: the
  // invitation record and shareable link already exist, so a missing config or
  // delivery failure must never fail the invitation itself.
  let emailSent = false;
  try {
    const result = await sendInvitationEmail({
      to: email,
      inviterName: user.fullName,
      workspaceName: user.workspaceName,
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    emailSent = result.sent;
  } catch (err) {
    console.error("[mannat] invitation email failed:", err);
  }

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "member.invited",
    entityType: "member",
    title: "Member invited",
    description: `invited ${email} as ${role === "admin" ? "Admin" : "Member"}`,
  });

  const invitedUserRows = await sql`
    select id from neon_auth.user where lower(email) = ${email} limit 1
  `;
  if (invitedUserRows.length > 0) {
    await notifyUser({
      workspaceId: user.workspaceId,
      userId: invitedUserRows[0].id,
      type: "member.invited",
      title: "You've been invited",
      message: `${user.workspaceName} invited you to join as ${
        role === "admin" ? "Admin" : "Member"
      }.`,
      entityType: "member",
    });
  }

  revalidatePath("/dashboard/team");
  return { success: true, token, inviteUrl, emailSent };
}

export async function acceptInvitationAction(
  token: string,
): Promise<TeamActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in to accept an invitation." };

  const sql = getDb();

  const rows = await sql`
    select workspace_id, email, role, expires_at, accepted_at
    from team_invitations
    where token = ${token}
    limit 1
  `;
  const invitation = rows[0];
  if (!invitation) return { error: "This invitation is invalid." };
  if (invitation.accepted_at) {
    return { error: "This invitation has already been accepted." };
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return { error: "This invitation has expired." };
  }

  const invitedEmail = String(invitation.email).trim().toLowerCase();
  if (normalizeEmail(user.email) !== invitedEmail) {
    return {
      error: `This invitation was sent to ${invitation.email}, but you are signed in as ${user.email}.`,
    };
  }

  // Insert membership (no-op on duplicate) and mark accepted in one statement.
  await sql`
    with ins as (
      insert into workspace_members (workspace_id, user_id, role)
      values (${invitation.workspace_id}, ${user.id}, ${invitation.role})
      on conflict (workspace_id, user_id) do nothing
    )
    update team_invitations
    set accepted_at = now()
    where token = ${token} and accepted_at is null
  `;

  // Switch the member's active workspace to the one they just joined.
  await sql`
    update profiles
    set active_workspace_id = ${invitation.workspace_id}
    where id = ${user.id}
  `;

  await logActivity({
    workspaceId: invitation.workspace_id,
    actorUserId: user.id,
    eventType: "member.joined",
    entityType: "member",
    title: "Member joined",
    description: "joined the workspace",
  });

  await notifyOwnersAndAdmins({
    workspaceId: invitation.workspace_id,
    type: "member.joined",
    title: "New member joined",
    message: `${user.fullName} joined the workspace as ${
      invitation.role === "admin" ? "Admin" : "Member"
    }.`,
    entityType: "member",
    excludeUserId: user.id,
    preferenceKey: "member_updates",
  });

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMemberRoleAction(
  memberId: string,
  role: string,
): Promise<TeamActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  if (!canManage(user)) {
    return { error: "You don't have permission to change roles." };
  }

  const nextRole = role as TeamRole;
  if (nextRole !== "admin" && nextRole !== "member") {
    return { error: "Invalid role." };
  }

  const sql = getDb();

  const rows = await sql`
    select wm.role, wm.user_id, p.full_name
    from workspace_members wm
    join profiles p on p.id = wm.user_id
    where wm.workspace_id = ${user.workspaceId} and wm.id = ${memberId}
    limit 1
  `;
  const target = rows[0];
  if (!target) return { error: "Member not found." };
  if (target.role === "owner") {
    return { error: "The owner's role cannot be changed." };
  }
  if (user.role === "admin" && target.role === "admin") {
    return { error: "Admins cannot change other admins." };
  }

  await sql`
    update workspace_members
    set role = ${nextRole}
    where workspace_id = ${user.workspaceId} and id = ${memberId}
  `;

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "member.role_changed",
    entityType: "member",
    title: "Member role changed",
    description: `changed ${target.full_name ?? "a member"}'s role to ${
      nextRole === "admin" ? "Admin" : "Member"
    }`,
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function removeMemberAction(
  memberId: string,
): Promise<TeamActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  if (!canManage(user)) {
    return { error: "You don't have permission to remove members." };
  }

  const sql = getDb();

  const rows = await sql`
    select wm.role, wm.user_id, p.full_name
    from workspace_members wm
    join profiles p on p.id = wm.user_id
    where wm.workspace_id = ${user.workspaceId} and wm.id = ${memberId}
    limit 1
  `;
  const target = rows[0];
  if (!target) return { error: "Member not found." };
  if (target.role === "owner") {
    return { error: "The workspace owner cannot be removed." };
  }
  if (target.user_id === user.id) {
    return { error: "You cannot remove yourself." };
  }
  if (user.role === "admin" && target.role === "admin") {
    return { error: "Admins cannot remove other admins." };
  }

  const removedUserId = target.user_id as string;

  // Clean up this member's assignments within this workspace so removing them
  // doesn't leave stale project memberships or task assignments behind.
  await sql`
    delete from project_members
    where workspace_id = ${user.workspaceId} and user_id = ${removedUserId}
  `;
  await sql`
    update tasks
    set assignee_user_id = null, updated_at = now()
    where workspace_id = ${user.workspaceId} and assignee_user_id = ${removedUserId}
  `;

  await sql`
    delete from workspace_members
    where workspace_id = ${user.workspaceId} and id = ${memberId}
  `;

  await logActivity({
    workspaceId: user.workspaceId,
    actorUserId: user.id,
    eventType: "member.removed",
    entityType: "member",
    title: "Member removed",
    description: `removed ${target.full_name ?? "a member"}`,
  });

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function cancelInvitationAction(
  invitationId: string,
): Promise<TeamActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in." };
  if (!canManage(user)) {
    return { error: "You don't have permission to revoke invitations." };
  }

  const sql = getDb();
  await sql`
    delete from team_invitations
    where workspace_id = ${user.workspaceId}
      and id = ${invitationId}
      and accepted_at is null
  `;

  revalidatePath("/dashboard/team");
  return { success: true };
}
