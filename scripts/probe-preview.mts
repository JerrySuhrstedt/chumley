import { config } from "dotenv";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
config({ path: ".env.local" });
const p = new Paddle(process.env.PADDLE_API_KEY!, { environment: Environment.sandbox });
const SUB = "sub_01m0dw05r1ge5xz5mqnyxjxrz4";
const SOLO_MONTHLY = "pri_01m0dtmkv0ph4s7f6jf0sqaegr";

for (const q of [1, 3, 5]) {
  const prev = await p.subscriptions.previewUpdate(SUB, {
    items: [{ priceId: SOLO_MONTHLY, quantity: q }],
    prorationBillingMode: "do_not_bill",
  });
  const due = prev.immediateTransaction?.details?.totals?.grandTotal ?? "0";
  const rec = prev.recurringTransactionDetails?.totals?.total;
  console.log(`${q} seat(s): due now $${(Number(due)/100).toFixed(2)}, then $${(Number(rec)/100).toFixed(2)}`);
}
