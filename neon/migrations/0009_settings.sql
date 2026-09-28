-- ============================================================================
-- MANNAT — Settings (Neon Postgres)
--
-- Per-user, per-workspace notification preferences. Everything else the
-- Settings module needs already lives in existing tables: `profiles.full_name`
-- (profile name), `workspaces.name` (workspace name), and the workspace
-- membership role system (owner/admin/member).
--
-- Preferences are keyed by (workspace_id, user_id) so they're scoped to a user's
-- membership in a workspace. Absent a row, both preferences default to `true`.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id text not null,
  member_updates boolean not null default true,
  invoice_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
