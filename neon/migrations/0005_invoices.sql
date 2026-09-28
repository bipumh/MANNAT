-- ============================================================================
-- MANNAT — Invoices module (Neon Postgres)
--
-- Invoices belong to a workspace and a client, and may optionally belong to a
-- project. Workspace boundaries are enforced by the foreign-key chain plus
-- application-layer authorization (queries scoped by the authenticated
-- session's workspace id).
--
-- Invoice numbers are generated per workspace via a dedicated counter table
-- (see workspace_invoice_counters), so concurrent creation cannot produce
-- duplicate numbers.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

-- Invoices --------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, invoice_number)
);

create index if not exists invoices_workspace_idx
  on public.invoices (workspace_id);
create index if not exists invoices_workspace_client_idx
  on public.invoices (workspace_id, client_id);
create index if not exists invoices_workspace_project_idx
  on public.invoices (workspace_id, project_id);
create index if not exists invoices_workspace_status_idx
  on public.invoices (workspace_id, status);
create index if not exists invoices_workspace_created_idx
  on public.invoices (workspace_id, created_at desc);
create index if not exists invoices_workspace_due_idx
  on public.invoices (workspace_id, due_date);

-- Per-workspace invoice number counter ---------------------------------------
create table if not exists public.workspace_invoice_counters (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  next_number integer not null default 1
);
