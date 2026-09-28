-- ============================================================================
-- MANNAT — Activity & Notifications (Neon Postgres)
--
-- A lightweight, append-only activity history plus per-user, workspace-scoped
-- in-app notifications. Identity remains Neon Auth (Better Auth): user ids are
-- the Neon Auth user id (text, matching `profiles.id` / `workspace_members.user_id`).
--
-- Activity events are written by the server actions of the other modules. No
-- event-bus / queue — just a single insert per business event, best-effort.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

-- Activity events -------------------------------------------------------------
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id text,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_workspace_created_idx
  on public.activity_events (workspace_id, created_at desc);
create index if not exists activity_events_workspace_entity_idx
  on public.activity_events (workspace_id, entity_type, entity_id);
create index if not exists activity_events_actor_created_idx
  on public.activity_events (actor_user_id, created_at desc);

-- Notifications ---------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id text not null,
  type text not null,
  title text not null,
  message text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, read_at);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_workspace_created_idx
  on public.notifications (workspace_id, created_at desc);
