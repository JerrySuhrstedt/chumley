// Temporary: run every query the admin page runs, find the one that throws.
import { config } from "dotenv";
config({ path: ".env.local" });

const run = async () => {
  const mod = await import("../src/lib/admin-data");
  for (const fn of ["getAdminMetrics", "getAdminAccounts", "getAdminUsers", "getAdminReports", "getAdminTrends"] as const) {
    const t = Date.now();
    try {
      const result = await (mod[fn] as () => Promise<unknown>)();
      const n = Array.isArray(result) ? result.length : Object.keys(result as object).length;
      console.log(`OK   ${fn} (${n} items/keys) in ${Date.now() - t}ms`);
    } catch (e) {
      console.log(`FAIL ${fn} in ${Date.now() - t}ms:`, e instanceof Error ? e.message : e);
    }
  }
  process.exit(0);
};
run();
