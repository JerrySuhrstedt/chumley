import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
