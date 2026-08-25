import { afterAll, describe, expect, it } from "vitest";
import { dbConfigured, sql, withOrg } from "./db";

/**
 * The access gate, against a real Postgres.
 *
 * These are the rules that decide whether somebody can use what they paid
 * for, and they are the ones with the least forgiving failure mode: too
 * strict locks out a paying customer, too loose gives the product away.
 */
const suite = dbConfigured ? describe : describe.skip;

afterAll(async () => {
  await sql?.end();
});

suite("trial and comp precedence", () => {
  it("gives a new team the full trial window", async () => {
    await withOrg("trial-new", async (orgId) => {
      const { getBillingState } = await import("@/lib/paddle/access");
      const s = await getBillingState(orgId);
      expect(s.readOnly).toBe(false);
      expect(s.inTrial).toBe(true);
    });
  });

  it("drops a team to read-only once the trial is spent", async () => {
    await withOrg("trial-spent", async (orgId) => {
      await sql!`UPDATE organizations SET created_at = now() - interval '20 days'
                 WHERE id = ${orgId}`;
      const { getBillingState } = await import("@/lib/paddle/access");
      const s = await getBillingState(orgId);
      expect(s.readOnly).toBe(true);
      expect(s.seatsLeft).toBe(0);
    });
  });

  it("lets a comp outrank a spent trial", async () => {
    await withOrg("comp-beats-trial", async (orgId) => {
      await sql!`UPDATE organizations
                 SET created_at = now() - interval '20 days', comped_at = now()
                 WHERE id = ${orgId}`;
      const { getBillingState } = await import("@/lib/paddle/access");
      const s = await getBillingState(orgId);
      expect(s.comped).toBe(true);
      expect(s.readOnly).toBe(false);
    });
  });

  it("stops honouring a comp once its end date passes", async () => {
    await withOrg("comp-expired", async (orgId) => {
      await sql!`UPDATE organizations
                 SET created_at = now() - interval '20 days',
                     comped_at = now() - interval '10 days',
                     comped_until = now() - interval '1 day'
                 WHERE id = ${orgId}`;
      const { getBillingState } = await import("@/lib/paddle/access");
      const s = await getBillingState(orgId);
      expect(s.comped).toBe(false);
      expect(s.readOnly).toBe(true);
    });
  });
});

suite("one live subscription per team", () => {
  it("refuses a second subscription that is not cancelled", async () => {
    await withOrg("dupe-sub", async (orgId) => {
      await sql!`INSERT INTO subscriptions (id, org_id, customer_id, status, price_id)
                 VALUES ('sub_ZZZ_A', ${orgId}, 'ctm_z', 'active', 'pri_z')`;
      await expect(
        sql!`INSERT INTO subscriptions (id, org_id, customer_id, status, price_id)
             VALUES ('sub_ZZZ_B', ${orgId}, 'ctm_z', 'active', 'pri_z')`
      ).rejects.toThrow();
    });
  });

  it("allows a new subscription after the old one is cancelled", async () => {
    await withOrg("resubscribe", async (orgId) => {
      await sql!`INSERT INTO subscriptions (id, org_id, customer_id, status, price_id)
                 VALUES ('sub_ZZZ_C', ${orgId}, 'ctm_z', 'canceled', 'pri_z')`;
      await expect(
        sql!`INSERT INTO subscriptions (id, org_id, customer_id, status, price_id)
             VALUES ('sub_ZZZ_D', ${orgId}, 'ctm_z', 'active', 'pri_z')`
      ).resolves.toBeDefined();
    });
  });
});
