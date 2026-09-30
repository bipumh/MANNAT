-- ============================================================================
-- MANNAT — Team Member Workspace (Neon Postgres)
--
-- Adds the data model that lets individual team members do their own work:
--   * project_members  — which workspace members are assigned to a project
--   * tasks.assignee_user_id — which member a task is assigned to
--   * time_entries.user_id — which member owns a time entry
--   * work_logs        — a narrative record of what a member actually did
--
-- All "person" columns store the Neon Auth (Better Auth) user id (text),
-- matching `profiles.id` / `workspace_members.user_id`. Workspace boundaries
-- are enforced by `workspace_id` foreign keys plus application-layer
-- authorization (queries scoped by the authenticated session's workspace id).
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

-- 1. Project <-> member assignment ------------------------------------------
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_members_workspace_idx
  on public.project_members (workspace_id);
create index if not exists project_members_project_idx
  on public.project_members (project_id);
create index if not exists project_members_user_idx
  on public.project_members (user_id);

-- 2. Task assignee -----------------------------------------------------------
alter table public.tasks
  add column if not exists assignee_user_id text;

create index if not exists tasks_workspace_assignee_idx
  on public.tasks (workspace_id, assignee_user_id);

-- 3. Time-entry ownership ----------------------------------------------------
alter table public.time_entries
  add column if not exists user_id text;

create index if not exists time_entries_workspace_user_idx
  on public.time_entries (workspace_id, user_id);

-- Backfill existing time entries to their workspace owner so every entry has an
-- owner before the application starts writing `user_id` on new entries.
update public.time_entries te
set user_id = (
  select wm.user_id
  from public.workspace_members wm
  where wm.workspace_id = te.workspace_id and wm.role = 'owner'
  order by wm.created_at asc
  limit 1
)
where te.user_id is null;

-- 4. Work log -----------------------------------------------------------------
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  user_id text not null,
  work_date date not null default current_date,
  description text not null check (length(description) > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  billable boolean not null default true,
  rate numeric(12, 2) check (rate >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_logs_workspace_created_idx
  on public.work_logs (workspace_id, created_at desc);
create index if not exists work_logs_workspace_client_idx
  on public.work_logs (workspace_id, client_id);
create index if not exists work_logs_workspace_project_idx
  on public.work_logs (workspace_id, project_id);
create index if not exists work_logs_workspace_user_idx
  on public.work_logs (workspace_id, user_id);
