import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { toolSignups } from "@/db/schema";

/**
 * Handing over the tracker, and counting that it happened.
 *
 * Two ways out, and the default is the file.
 *
 * The first build sent everybody to Google Sheets, because that is what
 * Salesmate and OnePageCRM do. It was the wrong default for this audience.
 * Copying a Google Sheet requires a Google account, so a contractor without
 * one hits a sign-in wall instead of getting the thing they just gave their
 * email for. Excel is also the more familiar tool for most of these buyers,
 * and serving the file ourselves means no third-party account, no sharing
 * settings to get wrong, and nothing outside this repo that can break the
 * giveaway.
 *
 * ?format=sheets keeps the Google route for anyone who prefers it.
 *
 * Either way the visit is recorded first. A missing or mangled token still
 * gets the file: somebody who broke the URL copying it out of an email
 * should get their spreadsheet, not a lecture. The count is a measurement,
 * not a gate.
 */

const FILE = "/sales-pipeline-tracker.xlsx";

const SHEET_URL =
  process.env.TRACKER_SHEET_URL ??
  "https://docs.google.com/spreadsheets/d/1hAGhcMY7jGNA9X2SFgmhG-TzUxR84CBEMgal0MgGe7k/copy";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const wantsSheets = request.nextUrl.searchParams.get("format") === "sheets";

  if (token) {
    try {
      await db
        .update(toolSignups)
        .set({
          // First open only. After that the timestamp stops moving and the
          // counter carries the repeats, which is the more useful pair.
          downloadedAt: sql`COALESCE(${toolSignups.downloadedAt}, now())`,
          downloadCount: sql`${toolSignups.downloadCount} + 1`,
        })
        .where(eq(toolSignups.token, token));
    } catch (e) {
      // Never block the handover on the analytics write.
      console.error("[tracker] could not record download", e);
    }
  }

  const target = wantsSheets
    ? SHEET_URL
    : new URL(FILE, request.nextUrl.origin).toString();

  return NextResponse.redirect(target, { status: 302 });
}
