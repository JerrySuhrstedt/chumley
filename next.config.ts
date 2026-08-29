import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the same wifi load the dev server's JS when
  // visiting by LAN IP. Without it the HTML renders but every tap is dead.
  allowedDevOrigins: ["192.168.0.219"],
  async headers() {
    return [
      {
        // Security defaults for the whole app. The embed exception below is
        // listed AFTER this block on purpose: when both rules match a path
        // (only /f/:token does), Next applies the later rule's value for any
        // header key the two share, so the embed re-opens framing while the
        // nosniff and referrer defaults set here still apply to it.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // The embeddable form is meant to be framed by a customer's own
        // website, so it opts out of the framing restrictions the rest of
        // the app should keep. Listed last so its framing headers override
        // the app-wide defaults above for this path.
        source: "/f/:token*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
