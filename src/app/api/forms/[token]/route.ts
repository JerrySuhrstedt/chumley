import { NextResponse, type NextRequest } from "next/server";
import { submitPublicLead } from "@/lib/public-form";

/**
 * Where a website form posts to.
 *
 * Open to any origin on purpose. This is a public lead form: the token in
 * the URL is the only credential, exactly as it is for the hosted page, and
 * the customer's whole reason for having it is that strangers on their own
 * domain can reach it. There is no session and no cookie involved, so there
 * is nothing for a cross-site request to forge. Abuse is handled where it
 * should be, by the per-org ingest cap inside submitPublicLead.
 *
 * Two shapes come in here and both are supported, because they come from
 * two different embeds:
 *
 * JSON, from the script embed, which wants JSON back so it can render its
 * own success state without a page load.
 *
 * Form-encoded, from a raw HTML form with no JavaScript at all. A browser
 * posting a plain form navigates, so that case redirects: to the page named
 * in a _redirect field if the customer set one, and otherwise to our own
 * thank-you page. Returning JSON there would dump raw text on a visitor.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let input: Record<string, unknown> = {};
  let redirectTo: string | null = null;

  try {
    if (isJson) {
      input = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      input = Object.fromEntries(form.entries());
      const wanted = String(form.get("_redirect") ?? "").trim();
      // Only absolute http(s) URLs, and never a javascript: or data: URI.
      // This value comes off a stranger's page, so it is treated as hostile.
      if (/^https?:\/\//i.test(wanted)) redirectTo = wanted;
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read that submission." },
      { status: 400, headers: CORS },
    );
  }

  const result = await submitPublicLead(token, input);

  if (isJson) {
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
      headers: CORS,
    });
  }

  // A plain form post navigates, so send them somewhere readable.
  const origin = request.nextUrl.origin;
  if (!result.ok) {
    const back = new URL(`/f/${token}`, origin);
    back.searchParams.set("error", result.error);
    return NextResponse.redirect(back, { status: 303 });
  }

  return NextResponse.redirect(
    redirectTo ?? new URL(`/f/${token}/thanks`, origin).toString(),
    { status: 303 },
  );
}
