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

## Trap 1: drizzle-kit migrate silently does nothing

`drizzle.__drizzle_migrations` is **empty** while `drizzle/` holds several
migration files. The schema was pushed, not migrated. So `drizzle-kit
migrate` replays from 0001, finds the tables already exist, and exits
reporting success without applying anything.

`tool_signups` was created with raw DDL for this reason. Until the journal
is baselined or the migration files are dropped in favour of `push`, verify
every schema change actually landed:

```
SELECT to_regclass('public.your_new_table');
```

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

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_BREAKGLASS_DATABASE_URL` are still set. The first two are public
and ship in the browser bundle. Check whether anything still reads them
before assuming they are needed.
