-- ============================================================================
-- MANNAT — Neon Postgres schema (application data model)
--
-- Identity comes from Neon Auth (Managed Better Auth); this file creates the
-- application tables that hang off it. The Neon Auth user id (a string, stored
-- in the `neon_auth` schema) is referenced by `profiles.id` and
-- `workspace_members.user_id`.
--
-- Authorization is enforced in the application layer (server-only queries are
-- always scoped by the authenticated session's user id) — no Supabase-style
-- RLS / auth.uid() / DB triggers are used here.
--
-- Apply via the Neon SQL editor, or the bundled `scripts/apply-schema.mjs`
-- helper. The file is idempotent: safe to run more than once.
-- ============================================================================

-- 1. Profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id text primary key,                     -- Neon Auth (Better Auth) user id
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Workspaces --------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Workspace members -------------------------------------------------------
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id text not null,                   -- Neon Auth (Better Auth) user id
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_idx
  on public.workspace_members (workspace_id);
