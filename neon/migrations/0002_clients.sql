-- ============================================================================
-- MANNAT — Clients module (Neon Postgres)
--
-- Clients belong to a workspace and are scoped to it. Authorization is enforced
-- in the application layer (server-only queries are always scoped by the
-- authenticated session's workspace id), consistent with the rest of the
-- application data model.
--
-- Apply via `scripts/apply-schema.mjs` (applies all files in this directory) or
-- paste into the Neon SQL editor. Idempotent: safe to run more than once.
-- ============================================================================

-- Clients ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (length(name) > 0),
  company text,
  email text,
  phone text,
  website text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_workspace_idx
  on public.clients (workspace_id);
create index if not exists clients_workspace_created_idx
  on public.clients (workspace_id, created_at desc);
