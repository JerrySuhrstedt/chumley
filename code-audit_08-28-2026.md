# Chumley code audit

08-28-2026. Full-repo audit: six parallel reviewers (security, server actions, data layer, billing, frontend, config/scripts/tests) plus a verification pass that re-read every high-severity finding in source before it made this list. Roughly 28,600 lines reviewed.

**Verdict:** the architecture is sound and most of the code is careful. Tenancy scoping, webhook signature handling, admin gating, SQL injection surface, XSS surface, and secrets hygiene all came back clean. What the audit found instead is a short list of real security holes that are cheap to fix, one destructive script that should not exist, a database that has no indexes, and a cluster of touch-interaction bugs in the board, which is the product.

**Gates:** production build passes, `tsc --noEmit` clean, 70 tests pass (12 skipped), lint has 2 trivial errors (unescaped apostrophes in `privacy/page.tsx`) and 6 unused-variable warnings.

---

## P1. Fix this week: security and money

### 1. Open redirect on password sign-in and sign-up
`src/app/login/actions.ts:37,68` pass the form's `next` value straight to `redirect(next)` with no same-origin check. `chumley.app/login?next=https://evil.com` sends a freshly signed-in user off-site, which is a phishing hand-off laundered through your real domain. The OAuth and magic-link paths are protected by Better Auth's `trustedOrigins`; only the password paths are exposed. Fix: reject any `next` that does not start with a single `/` (and block `//`).

### 2. Cross-tenant activity injection
`logActivity` (`src/app/(app)/_leads/actions.ts:345`), `addLeadNote` (`:494`), and `logSentMessage` (`:582`) insert an activity with a client-supplied `leadId` and never check the lead belongs to the caller's org. `logCallTouch` does exactly this check and its comment explains why; the siblings forgot it. Verified end to end: the pipeline and contacts pages load timelines via the `activities` relation, which joins on `leadId` only, so an injected note renders in the victim team's timeline, and the victim's `deleteActivity` can never remove it because its org filter never matches the row. Mitigating factor: the attacker needs a victim lead UUID, which is random. Fix: copy the ownership check from `logCallTouch` into all three.

### 3. Paddle checkout trusts the browser
Two related holes, both verified:

- **Org**: `checkout.tsx:123` sets `customData: { orgId }` in client JS, and the webhook's `orgIdFrom` (`src/lib/paddle/sync.ts:19-24`) uses it with no check that the payer belongs to that org. Anyone with the public client token can open a checkout with another team's org UUID, attach a subscription to them, overwrite their `paddleCustomerId`, then cancel, pushing a mid-trial team read-only.
- **Price**: `checkout.tsx:113` sends the `priceId` from the browser, and legacy price IDs ship in the bundle via `catalog.ts`. The `correctTier` healer only runs when status is `active`, so a legacy price rides the whole 14-day trial.

Fix direction: mint the transaction server-side (Paddle transaction API) so the server chooses org and price, or at minimum have the webhook verify the payer's membership in the claimed org.

Related: `sync.ts:221-233` upserts on subscription id only, while `subscriptions_org_live_idx` is unique on org where status is not canceled. A `subscription.created` for an org that already has a live or paused row throws, returns 500, and Paddle retries forever. This is also the failure mode of the attack above against an actively subscribed team.

### 4. Delete the destructive scripts
`scripts/migrate-to-neon.mjs:63-64` runs `DELETE FROM` on every table of