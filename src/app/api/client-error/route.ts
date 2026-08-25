import { NextResponse } from "next/server";
import { reportError } from "@/lib/report-error";

/**
 * Where a browser crash gets reported.
 *
 * Public by necessity, since a page that has already failed cannot be
 * relied on to prove who it is. That makes it abusable, so it is
 * deliberately cheap to serve: the body is capped, nothing is stored, and
 * the alerting behind it throttles by error signature, meaning a flood of
 * junk produces one email rather than thousands.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 8000) {
      return NextResponse.json({ ok: true });
    }

    const body = JSON.parse(raw) as {
      message?: unknown;
      stack?: unknown;
      digest?: unknown;
      path?: unknown;
    };

    const message = String(body.message ?? "").slice(0, 500);
    if (!message) return NextResponse.json({ ok: true });

    const error = new Error(message);
    error.stack = typeof body.stack === "string" ? body.stack : undefined;

    reportError(error, `browser${String(body.path ?? "")}`.slice(0, 120), {
      digest: typeof body.digest === "string" ? body.digest : undefined,
      agent: request.headers.get("user-agent")?.slice(0, 120) ?? undefined,
    });
  } catch {
    // A malformed report is not worth an error of its own.
  }
  return NextResponse.json({ ok: true });
}
