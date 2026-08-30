import { type NextRequest } from "next/server";
import { gate } from "@/lib/auth-gate";

export function proxy(request: NextRequest) {
  return gate(request);
}

export const config = {
  matcher: [
    // sw.js and the manifest must answer without a session, or the
    // browser will never consider the app installable.
    // Downloadable files belong here too, not just images. Anything the
    // gate sees, it gates: a signed-out visitor asking for the free
    // spreadsheet was being handed the login page instead, with a 200 and
    // a content-type of text/html, which is the kind of failure that looks
    // like a working button right up until somebody opens the file.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|xlsx|xls|csv|pdf|zip)$).*)",
  ],
};
