import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, leads, organizations } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";

function toNullable(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = toNullable(body.name);
  if (!name) {
    return NextResponse.json({ error: "\"name\" is required" }, { status: 400 });
  }

  const [lead] = await db
    .insert(leads)
    .values({
      orgId: org.id,
      name,
      email: toNullable(body.email),
      phone: normalizePhone(toNullable(body.phone)),
      companyName: toNullable(body.company),
      value: toNullable(body.value),
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

  revalidatePath("/");

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
