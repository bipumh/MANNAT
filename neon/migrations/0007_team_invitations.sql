-- ============================================================================
-- MANNAT — Team invitations (Neon Postgres)
--
-- Lightweight workspace invitations. Identity remains Neon Auth (Better Auth);
-- this table only tracks who was invited to a workspace, by whom, and whether
-- the invitation has been accepted. No email is actually sent in this phase —
-- the token is surfaced in the UI so the inviter can share the link directly.
--
-- `invited_by` stores the Neon Auth user id (text, matching `profiles.id` and
-- `workspace_members.user_id`). Ownership is expressed via the `owner` role in
-- `workspace_members`; invitations may only be created for `admin` or `member`.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role text not null default 'member'
    check (role in ('admin', 'member')),
  token text not null unique,
  invited_by text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists team_invitations_workspace_idx
  on public.team_invitations (workspace_id);
create index if not exists team_invitations_workspace_email_idx
  on public.team_invitations (workspace_id, email);
