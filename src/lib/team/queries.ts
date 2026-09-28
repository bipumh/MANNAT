import "server-only";

import { getDb } from "@/lib/db";
import type { TeamInvitation, TeamRole, WorkspaceMember, WorkspaceRole } from "@/types";

type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  full_name: string;
  email: string | null;
};

function mapWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    fullName: row.full_name,
    email: row.email ?? null,
  };
}

type TeamInvitationRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: TeamRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  inviter_name: string | null;
  workspace_name: string | null;
  expired: boolean;
};

function mapTeamInvitation(row: TeamInvitationRow): TeamInvitation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at ?? null,
    createdAt: row.created_at,
    inviterName: row.inviter_name ?? null,
    workspaceName: row.workspace_name ?? null,
    expired: row.expired,
  };
}

const MEMBER_COLUMNS = `
  wm.id, wm.workspace_id, wm.user_id, wm.role, wm.created_at,
  p.full_name,
  u.email
`;

const MEMBER_FROM = `
  from workspace_members wm
  join profiles p on p.id = wm.user_id
  left join neon_auth.user u on u.id::text = wm.user_id
`;

/**
 * Lists every member of a workspace, joined with their profile (name) and
 * Neon Auth user (email). Owner-first, then admins, then members, each ordered
 * by join date.
 */
export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${MEMBER_COLUMNS}
     ${MEMBER_FROM}
     where wm.workspace_id = $1
     order by
       case wm.role when 'owner' then 0 when 'admin' then 1 else 2 end,
       wm.created_at asc`,
    [workspaceId],
  )) as WorkspaceMemberRow[];

  return rows.map(mapWorkspaceMember);
}

/**
 * Returns a single workspace member (by membership id) scoped to the workspace,
 * or `null` when it does not exist or belongs to another workspace.
 */
export async function getWorkspaceMember(
  workspaceId: string,
  memberId: string,
): Promise<WorkspaceMember | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${MEMBER_COLUMNS}
     ${MEMBER_FROM}
     where wm.workspace_id = $1 and wm.id = $2
     limit 1`,
    [workspaceId, memberId],
  )) as WorkspaceMemberRow[];

  return rows[0] ? mapWorkspaceMember(rows[0]) : null;
}

const INVITATION_COLUMNS = `
  ti.id, ti.workspace_id, ti.email, ti.role, ti.token, ti.invited_by,
  ti.expires_at, ti.accepted_at, ti.created_at,
  p.full_name as inviter_name,
  null::text as workspace_name,
  (ti.expires_at < now()) as expired
`;

/**
 * Lists the workspace's still-pending invitations, newest first, joined with
 * the inviter's name.
 */
export async function listPendingInvitations(
  workspaceId: string,
): Promise<TeamInvitation[]> {
  const sql = getDb();

  const rows = (await sql.query(
    `select ${INVITATION_COLUMNS}
     from team_invitations ti
     left join profiles p on p.id = ti.invited_by
     where ti.workspace_id = $1 and ti.accepted_at is null
     order by ti.created_at desc`,
    [workspaceId],
  )) as TeamInvitationRow[];

  return rows.map(mapTeamInvitation);
}

/**
 * Looks up an invitation by its token, joined with the workspace name. Returns
 * `null` when the token is unknown.
 */
export async function getInvitationByToken(
  token: string,
): Promise<TeamInvitation | null> {
  const sql = getDb();

  const rows = (await sql.query(
    `select
       ti.id, ti.workspace_id, ti.email, ti.role, ti.token, ti.invited_by,
       ti.expires_at, ti.accepted_at, ti.created_at,
       p.full_name as inviter_name,
       w.name as workspace_name,
       (ti.accepted_at is null and ti.expires_at < now()) as expired
     from team_invitations ti
     join workspaces w on w.id = ti.workspace_id
     left join profiles p on p.id = ti.invited_by
     where ti.token = $1
     limit 1`,
    [token],
  )) as TeamInvitationRow[];

  return rows[0] ? mapTeamInvitation(rows[0]) : null;
}
