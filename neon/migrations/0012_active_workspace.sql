-- ============================================================================
-- MANNAT — Active workspace selection (Neon Postgres)
--
-- A user may belong to multiple workspaces (e.g. their auto-created personal
-- workspace plus a workspace they were invited into). This adds a per-user
-- pointer to the workspace their session should be scoped to.
--
-- The application layer sets it when a user signs up (their personal workspace)
-- and when they accept an invitation (the inviter's workspace). The session
-- helper falls back to the oldest membership when this column is null, so
-- single-workspace users are unaffected.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

alter table public.profiles
  add column if not exists active_workspace_id uuid
  references public.workspaces (id) on delete set null;
