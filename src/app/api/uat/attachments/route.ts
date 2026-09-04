import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { uatAttachments, uatTesters } from "@/db/schema";
import { CHECK_IDS } from "@/app/uat/checks";

/**
 * A tester's screenshot, uploaded the moment it is picked so its id can
 * ride in the draft and the submission. Public like the punch list
 * itself: testers have no accounts. Each image is bounded; the guards
 * below bound the COUNT too, because this table shares the database with
 * every team's leads, so an unbounded upload flood is a whole-app outage,
 * not just junk. Content is sniffed so the route cannot be used to host
 * arbitrary bytes on the domain under an image content type.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** How many uploads, and how many bytes, the whole route accepts per hour. */
const HOURLY_FILE_CAP = 200;
const HOURLY_BYTE_CAP = 400 * 1024 * 1024;

/** The declared type must match the actual leading bytes. */
function sniffMatches(type: string, buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const b = buf;
  switch (type) {
    case "image/png":
      return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/gif":
      return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
    case "image/webp":
      return (
        b[0] === 0x52 &&
        b[1] === 0x49 &&
        b[2] === 0x46 &&
        b[3] === 0x46 &&
        b[8] === 0x57 &&
        b[9] === 0x45 &&
        b[10] === 0x42 &&
        b[11] === 0x50
      );
    default:
      return false;
  }
}

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

  // A valid tester link is now required, not optional. The token used to be
  // accepted when missing or unknown, which left an anonymous door into a
  // table that shares the database with every team's leads. Every real
  // tester arrives through /uat/{token} and the client always sends it, so
  // this rejects only callers who have no business here. Checked before the
  // bytes are read and before the usage query, so a flood costs nothing.
  const tester = token
    ? await db
        .select({ id: uatTesters.id })
        .from(uatTesters)
        .where(eq(uatTesters.token, token))
        .limit(1)
    : [];
  const testerId = tester[0]?.id ?? null;
  if (!testerId) {
    return NextResponse.json(
      { error: "This upload needs a valid tester link." },
      { status: 401 }
    );
  }

  const [usage] = (await db.execute(sql`
    SELECT count(*)::int AS files,
           coalesce(sum(octet_length(data)), 0)::bigint AS bytes
    FROM uat_attachments
    WHERE created_at > now() - interval '1 hour'
  `)) as unknown as { files: number; bytes: string | number }[];
  if (
    usage.files >= HOURLY_FILE_CAP ||
    Number(usage.bytes) >= HOURLY_BYTE_CAP
  ) {
    return NextResponse.json(
      { error: "Uploads are busy right now. Try again shortly." },
      { status: 429 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  if (!sniffMatches(file.type, data)) {
    return NextResponse.json(
      { error: "That file is not the image it claims to be." },
      { status: 415 }
    );
  }

  const [row] = await db
    .insert(uatAttachments)
    .values({ testerId, checkId, contentType: file.type, data })
    .returning({ id: uatAttachments.id });

  // Opportunistic retention. This table lives in the shared database, and
  // test evidence has no reason to sit there forever, so each write clears
  // anything older than 30 days. At UAT volume this is a trivial sweep, and
  // it bounds a table that otherwise only ever grew.
  await db.execute(
    sql`DELETE FROM uat_attachments WHERE created_at < now() - interval '30 days'`
  );

  return NextResponse.json(
    { id: row.id },
    { headers: { "X-Content-Type-Options": "nosniff" } }
  );
}
