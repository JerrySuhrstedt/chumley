import { type NextRequest } from "next/server";
import { gate } from "@/lib/auth-gate";

export function proxy(request: NextRequest) {
  return gate(request);
}

export const config = {
  matcher: [
    // sw.js and the manifest must answer without a session, or the
    // browser will never consider the app installable.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
