import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uatAttachments } from "@/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serves a screenshot back to the tester's own thumbnails and to the
 * back office. The unguessable id is the whole access model, same as
 * the tester link: unlinked, not secret. Immutable-cached because a row
 * is never edited, only deleted.
 */
export async function GET(
  _req: Request,
  // Plain typing rather than RouteContext: that type is generated from
  // the route manifest, which does not know this route until a dev
  // server has run, and the build should not depend on that ordering.
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });

  const [row] = await db
    .select({
      contentType: uatAttachments.contentType,
      data: uatAttachments.data,
    })
    .from(uatAttachments)
    .where(eq(uatAttachments.id, id))
    .limit(1);
  if (!row) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}

/** The tester pressing the X on their own thumbnail, before submitting. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });
  await db.delete(uatAttachments).where(eq(uatAttachments.id, id));
  return new Response(null, { status: 204 });
}
