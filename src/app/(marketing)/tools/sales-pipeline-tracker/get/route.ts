import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { toolSignups } from "@/db/schema";

/**
 * Counting a download.
 *
 * A Google Sheets link cannot be tracked, so the link handed out is this
 * one. It records the visit and forwards. The same token goes on the page
 * and in the email, so it does not matter which copy somebody uses.
 *
 * A missing or unknown token still forwards. Somebody who mangled the URL
 * copying it out of an email should get their spreadsheet, not a lecture.
 * The count is a measurement, not a gate, and treating it as a gate would
 * mean punishing the people most likely to be real.
 */

/** Set once the sheet is published. /copy forces the Make a copy dialog. */
const SHEET_URL =
  process.env.TRACKER_SHEET_URL ??
  "https://docs.google.com/spreadsheets/d/REPLACE_ME/copy";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");

  if (token) {
    try {
      await db
        .update(toolSignups)
        .set({
          // First open only. After that the timestamp stops moving and the
          // counter carries the repeat visits, which is the more useful pair.
          downloadedAt: sql`COALESCE(${toolSignups.downloadedAt}, now())`,
          downloadCount: sql`${toolSignups.downloadCount} + 1`,
        })
        .where(eq(toolSignups.token, token));
    } catch (e) {
      // Never block the redirect on the analytics write. The person came
      // here for a spreadsheet.
      console.error("[tracker] could not record download", e);
    }
  }

  return NextResponse.redirect(SHEET_URL, { status: 302 });
}
