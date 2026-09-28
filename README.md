# MANNAT

A premium business-management SaaS platform — clients, projects, tasks, invoices, time tracking, team management, activity, notifications and settings in one workspace.

## Status

Feature-complete. Every module is backed by real **Neon** data (PostgreSQL + Managed Better Auth): Clients, Projects, Tasks, Invoices, Time tracking, Team & members (with invitations), Activity, Notifications, and Settings. The dashboard renders live workspace metrics (revenue, outstanding, active clients/projects, open tasks, tracked time).

## Tech stack

- **Next.js 16** (App Router, TypeScript, `proxy` for auth protection)
- **Tailwind CSS v4** (design tokens via `@theme`)
- **Neon** — PostgreSQL (`@neondatabase/serverless`) + Managed Better Auth (`@neondatabase/auth`)
- **Framer Motion** (restrained scroll reveals)
- **Lucide React** (icons)

## Pages

- `/` — Marketing landing page
- `/login` / `/signup` — Neon Auth (Managed Better Auth)
- `/dashboard` — Workspace overview (real metrics, revenue, projects, invoices, tasks, activity)
- `/dashboard/{clients,projects,tasks,invoices,time,team,activity,settings}` — Full modules
- `/invite/[token]` — Invitation acceptance

## Getting started

1. Provision Neon (Postgres + Auth) and pull the environment variables:

   ```bash
   neon env pull   # writes DATABASE_URL, NEON_AUTH_* into .env.local
   ```

   Generate `NEON_AUTH_COOKIE_SECRET` once and add it to `.env.local`:

   ```bash
   openssl rand -base64 32
   ```

2. Apply the schema migrations (idempotent):

   ```bash
   node --env-file=.env.local scripts/apply-schema.mjs
   ```

3. Run the app:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Build & quality

```bash
npm run lint
npm run build
npm run start
```

## Deployment

MANNAT runs on Vercel (Next.js is auto-detected). Before the first deploy:

1. Add the environment variables in Vercel:
   - `DATABASE_URL`
   - `NEON_AUTH_BASE_URL`
   - `NEON_AUTH_COOKIE_SECRET`
2. Apply the schema migrations to the production database:

   ```bash
   DATABASE_URL=<production-url> node scripts/apply-schema.mjs
   ```

3. Push `main` — Vercel deploys automatically.

## Architecture

```
src/
  app/             Route segments (marketing, auth, dashboard, invite, api/auth)
  components/      brand/, ui/, layout/, landing/, auth/, dashboard/ + one folder per module
  data/            Site configuration + marketing demo preview data
  lib/             Server-only data layer (auth/, db, and a queries/actions module per domain)
  proxy.ts         Session refresh + route protection (Next.js 16 proxy)
  types/           Shared domain types
neon/
  migrations/      SQL migrations (0001–0010)
scripts/
  apply-schema.mjs Applies all migrations in order (idempotent)
```

## Brand

Dark, emerald-accented identity:

- Background `#0B0F0D`, Surface `#151B18`
- Primary `#2DD4A8`, Accent `#6EE7B7`
- Text `#F3F7F5`, Muted `#9BA8A2`, Borders `#26332D`
