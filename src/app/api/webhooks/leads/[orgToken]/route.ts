import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { defaultStageKey } from "@/lib/stages";
import { activities, leads, organizations } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import { overIngestCap } from "@/lib/ingest-guard";
import { orgOwnerId } from "@/lib/org-owner";

function toNullable(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Zapier, Make and most form builders post a deal value as a JSON number,
 * not a string, so accept both rather than silently dropping it.
 */
function toAmount(value: unknown) {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value.replace(/[$,\s]/g, ""))
        : NaN;
  return Number.isFinite(n) ? String(n) : null;
}

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/webhooks/leads/[orgToken]">
) {
  const { orgToken } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.webhookToken, orgToken),
  });

  if (!org) {
    return NextResponse.json({ error: "Unknown webhook URL" }, { status: 404 });
  }

  if (await overIngestCap(org.id)) {
    // 429 tells a well-behaved integration to back off and retry.
    return NextResponse.json(
      { error: "Rate limit exceeded, retry later" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Same reasoning as the website form: this URL is public, so the only
  // thing bounding what lands in the database is what is bounded here.
  const cap = (v: string | null, n: number) => (v ? v.slice(0, n) : null);

  const name = cap(toNullable(body.name), 120);
  if (!name) {
    return NextResponse.json({ error: "\"name\" is required" }, { status: 400 });
  }

  const [lead] = await db
    .insert(leads)
    .values({
      ownerId: await orgOwnerId(org.id),
      orgId: org.id,
      name,
      email: cap(toNullable(body.email), 200),
      phone: normalizePhone(toNullable(body.phone)),
      companyName: cap(toNullable(body.company), 120),
      value: toAmount(body.value),
      // The team's own first bucket, not a hardcoded one. They are free
      // to rename or delete the bucket this used to assume existed.
      stage: await defaultStageKey(org.id),
    })
    .returning({ id: leads.id });

  // An inbound submission is a real touchpoint showing intent, so it starts
  // the timeline rather than arriving as a lead with no history.
  await db.insert(activities).values({
    orgId: org.id,
    leadId: lead.id,
    type: "form_submission",
    body: toNullable(body.source)
      ? `Submitted via ${toNullable(body.source)}`
      : "Inbound form submission",
  });

  revalidatePath("/pipeline");

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
