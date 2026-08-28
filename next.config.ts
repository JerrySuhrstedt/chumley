import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the same wifi load the dev server's JS when
  // visiting by LAN IP. Without it the HTML renders but every tap is dead.
  allowedDevOrigins: ["192.168.0.219"],
  async headers() {
    return [
      {
        // The embeddable form is meant to be framed by a customer's own
        // website, so it opts out of the framing restrictions the rest of
        // the app should keep.
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
