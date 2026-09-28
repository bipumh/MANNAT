-- ============================================================================
-- MANNAT — Invoice line items (Neon Postgres)
--
-- Normalized line items so billable time can be converted into invoice line
-- items. Each line item references at most one time entry (`time_entry_id` is
-- UNIQUE), which is what prevents the same time entry from being invoiced
-- twice at the database level. `on delete set null` preserves the line item
-- (and therefore the invoice total) if the underlying time entry is later
-- removed, and also preserves the original time entries themselves.
--
-- Apply via `scripts/apply-schema.mjs` or paste into the Neon SQL editor.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  time_entry_id uuid references public.time_entries (id) on delete set null,
  description text,
  quantity numeric(10, 4) not null default 0,
  unit_rate numeric(12, 2) not null default 0,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (time_entry_id)
);

create index if not exists invoice_items_invoice_idx
  on public.invoice_items (invoice_id);
create index if not exists invoice_items_workspace_idx
  on public.invoice_items (workspace_id);
