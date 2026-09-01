import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the same wifi load the dev server's JS when
  // visiting by LAN IP. Without it the HTML renders but every tap is dead.
  allowedDevOrigins: ["192.168.0.219"],
  async headers() {
    const baseline = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    return [
      {
        // Everything EXCEPT the embeddable form. The negative lookahead
        // matters: a rule that also matched /f/ would stack a second CSP
        // header there, and browsers intersect multiple CSPs, so
        // frame-ancestors 'self' would win over the '*' the form needs
        // and every customer's embedded form would silently stop framing.
        source: "/((?!f/).*)",
        headers: [
          ...baseline,
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        // The embeddable form is meant to be framed by a customer's own
        // website, so it keeps the baseline headers but not a restrictive
        // frame-ancestors. frame-ancestors * plus no X-Frame-Options is
        // the modern way to say "anyone may frame this"; the old
        // ALLOWALL was not a real X-Frame-Options value and did nothing.
        source: "/f/:token*",
        headers: [
          ...baseline,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
