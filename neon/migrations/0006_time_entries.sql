-- ============================================================================
-- MANNAT — Time Tracking module (Neon Postgres)
--
-- Time entries record minutes worked against a project (and optionally a
-- specific task within that project). Workspace boundaries are enforced by the
-- `workspace_id` foreign key plus application-layer authorization (queries
-- scoped by the authenticated session's workspace id).
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  description text,
  date date not null default current_date,
  duration_minutes integer not null check (duration_minutes > 0),
  billable boolean not null default true,
  hourly_rate numeric(12, 2) check (hourly_rate >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_entries_workspace_idx
  on public.time_entries (workspace_id);
create index if not exists time_entries_workspace_project_idx
  on public.time_entries (workspace_id, project_id);
create index if not exists time_entries_workspace_task_idx
  on public.time_entries (workspace_id, task_id);
create index if not exists time_entries_workspace_date_idx
  on public.time_entries (workspace_id, date);
create index if not exists time_entries_workspace_created_idx
  on public.time_entries (workspace_id, created_at desc);
