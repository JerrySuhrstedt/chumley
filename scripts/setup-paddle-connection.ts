import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { config } from "dotenv";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

config({ path: ".env.local" });

/**
 * Creates the two credentials the app needs on top of the API key, and
 * writes them straight into .env.local.
 *
 * The values are never printed. The webhook signing secret in particular
 * is what stops anybody who finds the public endpoint from posting a
 * forged "subscription.created" and handing themselves a paid account, so
 * it does not belong in a terminal log or a chat transcript.
 *
 * Re-running is safe. It looks for an existing destination on the same URL
 * and reuses it rather than making a second one, because two live
 * destinations means every event arrives twice.
 */

const ENV_PATH = ".env.local";
const WEBHOOK_URL = "https://sell1.app/api/webhooks/paddle";

const EVENTS = [
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "customer.created",
  "customer.updated",
] as const;

/** Sets a key in .env.local, replacing it in place if it is already there. */
function setEnv(key: string, value: string) {
  const line = `${key}=${value}`;
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  const re = new RegExp(`^${key}=.*$`, "m");

  if (re.test(text)) {
    text = text.replace(re, line);
  } else {
    if (text.length > 0 && !text.endsWith("\n")) text += "\n";
    text += `${line}\n`;
  }
  writeFileSync(ENV_PATH, text);
}

async function main() {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is not set in .env.local");
  }

  const paddle = new Paddle(process.env.PADDLE_API_KEY, {
    environment: Environment.sandbox,
  });

  // ------------------------------------------------ client-side token
  // Safe to ship to the browser, unlike the API key. Paddle.js will not
  // open a checkout without one.
  console.log("Client-side token...");
  const existingTokens = [];
  for await (const t of paddle.clientTokens.list()) existingTokens.push(t);

  const live = existingTokens.find(
    (t) => t.status === "active" && t.name === "Sell1 web"
  );
  const token = live ?? (await paddle.clientTokens.create({
    name: "Sell1 web",
    description: "Opens the checkout overlay on sell1.app",
  }));

  setEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", token.token);
  setEnv("NEXT_PUBLIC_PADDLE_ENV", "sandbox");
  console.log(`  ${live ? "reused" : "created"} ${token.id}`);

  // ------------------------------------------------ webhook destination
  console.log("\nWebhook destination...");
  // This one returns a plain array, unlike most list calls in the SDK.
  const existingDests = await paddle.notificationSettings.list();
  const already = existingDests.find((d) => d.destination === WEBHOOK_URL);

  if (already) {
    // The secret is only ever returned at creation, so an existing
    // destination cannot hand it back. Say so plainly rather than
    // writing a blank and letting the endpoint fail at 3am.
    console.log(`  a destination already points at this URL (${already.id})`);
    console.log("  its signing secret cannot be read back after creation.");
    console.log("  delete it in the dashboard and re-run to get a fresh one,");
    console.log("  or paste the saved secret into PADDLE_WEBHOOK_SECRET.");
  } else {
    const dest = await paddle.notificationSettings.create({
      description: "Sell1 production",
      destination: WEBHOOK_URL,
      type: "url",
      subscribedEvents: [...EVENTS],
      apiVersion: 1,
    });
    setEnv("PADDLE_WEBHOOK_SECRET", dest.endpointSecretKey);
    console.log(`  created ${dest.id}`);
    console.log(`  ${dest.destination}`);
    console.log(`  events: ${dest.subscribedEvents.map((e) => e.name).join(", ")}`);
  }

  setEnv("PADDLE_ENV", "sandbox");

  console.log("\nDone. Values written to .env.local, none printed here.");
}

main().catch((e) => {
  console.error("\nFailed:", e?.message ?? e);
  console.error(
    "\nIf this says forbidden, the API key needs the client_token.read,\n" +
    "client_token.write, notification_setting.read and\n" +
    "notification_setting.write scopes adding in the Paddle dashboard."
  );
  process.exit(1);
});
