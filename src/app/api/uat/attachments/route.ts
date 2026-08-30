import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { uatAttachments, uatTesters } from "@/db/schema";
import { CHECK_IDS } from "@/app/uat/checks";

/**
 * A tester's screenshot, uploaded the moment it is picked so its id can
 * ride in the draft and the submission. Public like the punch list
 * itself: testers have no accounts. The guards are the same stance as
 * the submit action's - shape rebuilt, sizes capped, and the worst an
 * abuser can do is store a few bounded images that nothing references.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "That upload did not come through." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const checkId = String(form.get("checkId") ?? "");
  const token = String(form.get("token") ?? "")
    .trim()
    .slice(0, 64);

  if (!(file instanceof File) || !CHECK_IDS.has(checkId)) {
    return NextResponse.json(
      { error: "That upload did not come through." },
      { status: 400 }
    );
  }
  if (!TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Screenshots only: PNG, JPG, WebP or GIF." },
      { status: 415 }
    );
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is too big. 4MB is the cap." },
      { status: 413 }
    );
  }

  let testerId: string | null = null;
  if (token) {
    const tester = await db
      .select({ id: uatTesters.id })
      .from(uatTesters)
      .where(eq(uatTesters.token, token))
      .limit(1);
    testerId = tester[0]?.id ?? null;
  }

  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(uatAttachments)
    .values({ testerId, checkId, contentType: file.type, data })
    .returning({ id: uatAttachments.id });

  return NextResponse.json({ id: row.id });
}
