-- ============================================================================
-- MANNAT — Projects module (Neon Postgres)
--
-- Projects belong to a workspace and to a client within that workspace. The
-- `client_id` foreign key plus application-layer authorization (queries scoped
-- by the authenticated session's workspace id) together guarantee a project can
-- never reference a client from another workspace.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (length(name) > 0),
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'on_hold', 'completed')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  start_date date,
  due_date date,
  budget numeric(12, 2) check (budget >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_idx
  on public.projects (workspace_id);
create index if not exists projects_workspace_client_idx
  on public.projects (workspace_id, client_id);
create index if not exists projects_workspace_created_idx
  on public.projects (workspace_id, created_at desc);
create index if not exists projects_workspace_status_idx
  on public.projects (workspace_id, status);
