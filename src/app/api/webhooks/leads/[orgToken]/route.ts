import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads, organizations } from "@/db/schema";

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
      phone: toNullable(body.phone),
      companyName: toNullable(body.company),
      value: toNullable(body.value),
    })
    .returning({ id: leads.id });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
