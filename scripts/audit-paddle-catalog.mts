import { config } from "dotenv";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

config({ path: ".env.local" });

/** Read-only. Lists whatever already exists in the live catalog. */
const key = process.env.PADDLE_API_KEY ?? "";
if (!key) { console.error("No PADDLE_API_KEY."); process.exit(1); }
if (!key.startsWith("pdl_live_")) {
  console.error(
    key.startsWith("pdl_sdbx_")
      ? "That is a SANDBOX key (pdl_sdbx_). Expected a live key (pdl_live_)."
      : `Not a Paddle API key. Got something starting "${key.slice(0, 9)}". If you used pbpaste, your clipboard holds something else.`
  );
  process.exit(1);
}
console.log(`Key prefix: ${key.slice(0, 9)}...  (live)\n`);

const paddle = new Paddle(key, { environment: Environment.production });

const products: { id: string; name: string; status: string }[] = [];
for await (const p of paddle.products.list()) {
  products.push({ id: p.id, name: p.name, status: p.status });
}
const prices: { id: string; desc: string; amt: string; product: string; status: string }[] = [];
for await (const pr of paddle.prices.list()) {
  prices.push({
    id: pr.id,
    desc: pr.description ?? "",
    amt: `${pr.unitPrice.amount} ${pr.unitPrice.currencyCode}`,
    product: pr.productId ?? "",
    status: pr.status,
  });
}

console.log(`PRODUCTS in live: ${products.length}`);
for (const p of products) console.log(`  ${p.id}  ${p.status.padEnd(9)} ${p.name}`);
console.log(`\nPRICES in live: ${prices.length}`);
for (const p of prices) console.log(`  ${p.id}  ${p.status.padEnd(9)} ${p.amt.padEnd(12)} ${p.desc}`);

console.log(
  products.length === 0 && prices.length === 0
    ? "\n=> LIVE CATALOG IS EMPTY. Safe to seed."
    : "\n=> LIVE CATALOG IS NOT EMPTY. Do not seed without checking these first."
);
