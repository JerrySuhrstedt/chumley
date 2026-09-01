<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Infrastructure, and three traps in it

Written 08-31-2026 after each of these cost real time to rediscover.

## Where things live

| What | Where |
|---|---|
| Repo | `/Volumes/4TB ExtremePro/Dropbox/app development/chumley` |
| Vercel project | `chumley` (team `sumo-lab`) → chumley.app |
| Database | Neon, project **`neon-apricot-planet`**, db `neondb`, `us-east-1` |
| Auth | Better Auth (`users`, `sessions`, `accounts`, `verifications`) |
| Billing | Paddle, **live** |
| Email | Resend |

The Neon project cannot be renamed because the org is Vercel-managed, which
is why nothing there is called "chumley". Identify it by the endpoint
`ep-autumn-tree-avp1wbq4`, or by the `tool_signups` table, which only this
database has. The sibling project `neon-cordovan-ball` is **renchit**
(Vercel project `sumolab-web-wrench`). Do not confuse them: both are called
`neondb` and both have a leads-shaped schema.

## Migrations: baselined 09-01-2026, `db:migrate` now works

The journal (`drizzle.__drizzle_migrations`) was empty for months while
`drizzle/` held migration files, because the schema was pushed, not
migrated. `db:migrate` was therefore unusable (it aborted on the first
`CREATE TYPE` that already existed), so every change went out by hand and
several objects drifted: `notify_new_leads`, `lead_notice_log`, and
`retest_at` all lived in production and in no migration.

Fixed: the journal was baselined with the real file hashes for 0000-0006,
and `0007` captures the three drifted objects (with `IF NOT EXISTS`, so it
is a no-op against production and correct against a fresh rebuild) plus the
one-team-per-user unique index. **`db:migrate` works now** and is the way
to apply schema changes: `db:generate` then `db:migrate`.

A boot-time schema check in `src/instrumentation.ts` logs loudly if a
column the app reads is missing after a deploy, so drift can't hide again.

## Trap 2: the auth gate eats static files

`src/lib/auth-gate.ts` holds the public route allowlist and `src/proxy.ts`
holds the matcher. Anything not excluded by both gets redirected to /login.

This has now bitten four times: `/refunds`, `/api/client-error`, `/tools/`,
and `/sales-pipeline-tracker.xlsx`. The last one returned **200 with
content-type text/html** — the login page wearing an .xlsx extension, which
Excel refuses to open and which no visitor would ever report.

Adding a public page or a downloadable file means editing both files.

## Trap 3: six hours of history retention

Neon free tier. Point-in-time restore only reaches back six hours, and this
database holds real customer teams and a live paying subscription. Anything
broken on a Friday evening is unrecoverable by Saturday morning.

## Leftovers from the Supabase era

The SDK, its four `src/lib/supabase/` files, the two npm packages, and the
`migrate-to-neon.mjs` script are all deleted (09-01-2026): nothing read
them. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` should
be removed from Vercel env too, since they baked into the browser bundle.

`SUPABASE_BREAKGLASS_DATABASE_URL` is the only survivor. It is read by no
code, only pasted into `psql` by a human, and it expires when the Supabase
project is torn down (target: mid-September 2026). Nothing in code changes
at that point.
