-- ============================================================================
-- MANNAT — Tasks module (Neon Postgres)
--
-- Tasks belong to a project (which belongs to a workspace). Application-layer
-- authorization (queries scoped by the authenticated session's workspace id)
-- plus the `project_id` foreign key guarantee a task can never reference a
-- project from another workspace.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (length(title) > 0),
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'completed')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  due_date date,
  completed_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_workspace_idx
  on public.tasks (workspace_id);
create index if not exists tasks_workspace_project_idx
  on public.tasks (workspace_id, project_id);
create index if not exists tasks_workspace_created_idx
  on public.tasks (workspace_id, created_at desc);
create index if not exists tasks_workspace_status_idx
  on public.tasks (workspace_id, status);
