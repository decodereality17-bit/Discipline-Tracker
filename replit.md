# DisciplineX

A production-ready discipline-tracking SaaS: complete task management with a compounding 0–100 discipline score, streaks, gamification levels, analytics, and dark/purple glassmorphism UI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from `PORT` env)
- `pnpm --filter @workspace/disciplinex run dev` — run the frontend (port from `PORT` env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase credentials for auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Recharts, TanStack Query
- API: Express 5, contract-first (OpenAPI → Orval codegen)
- Auth: Supabase Auth (email/password)
- DB: PostgreSQL + Drizzle ORM (tables: profiles, tasks, user_stats, daily_activity)
- Validation: Zod (`zod/v4` in libs, `zod` in api-server), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle for API server), Vite (frontend)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema (profiles, tasks, user_stats, daily_activity)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — auto-generated Zod validators (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (tasks, stats, activity, profiles, health)
- `artifacts/disciplinex/src/` — React frontend (pages, components, hooks, lib)
- `artifacts/disciplinex/src/lib/supabase.ts` — lazy Supabase client (proxy pattern for env var safety)
- `artifacts/disciplinex/vercel.json` — Vercel SPA deployment config

## Architecture decisions

- **Contract-first API**: OpenAPI spec is written first, then Orval generates typed hooks and Zod validators. Never edit generated files.
- **Supabase for auth only**: Supabase handles authentication; all app data (tasks, stats, profiles) lives in the Replit-provisioned Postgres via Drizzle.
- **Lazy Supabase client**: Uses a Proxy pattern so `createClient()` is deferred until first use — prevents runtime crash when env vars arrive with a doubled prefix from Replit secrets.
- **Vite PORT/BASE_PATH**: Both `disciplinex` and `mockup-sandbox` vite configs use soft defaults (5173/5174 and `/`) when `PORT`/`BASE_PATH` are not set, so `pnpm build` works in CI without those env vars.
- **Discipline engine on server**: `POST /api/stats/:user_id/discipline` recalculates the compounding score, streak, and momentum on the server and is triggered client-side after every task completion.

## Product

- **Auth**: Supabase email/password signup + login; profile created on signup with display name
- **Dashboard (Command Center)**: Radial discipline gauge, streak card, 7-day bar chart, 84-day activity heatmap, today's task list with inline quick-add
- **Task Registry**: Full CRUD with priority, due date, completion toggle, create/edit dialogs, All/Today/Completed tabs
- **Analytics**: 7-day volume bar chart, execution efficiency area chart, 30-day discipline trajectory line chart
- **Insights & Honors**: Rank progression radial chart, momentum engine card, tactical advice, badge archive (First Blood, Consistency, Unbreakable, Ascension, Perfection)
- **Profile**: Display name editing, stats sidebar, session termination

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Replit secrets arrive as `KEY=KEY=value`**: The `cleanEnv()` helper in `vite.config.ts` strips the doubled prefix before passing values to Supabase `createClient`.
- **Run codegen after any OpenAPI change**: `pnpm --filter @workspace/api-spec run codegen` — this rebuilds both libs and type-checks. Don't skip it.
- **api-server uses plain `zod`** (not `zod/v4`): When adding new route validators, import from `@workspace/api-zod` (which re-exports Orval-generated schemas) — never import `zod/v4` directly in api-server.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
