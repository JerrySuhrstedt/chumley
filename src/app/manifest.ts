import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chumley CRM",
    // What fits under the icon on a home screen. Anything longer is cut.
    short_name: "Chumley",
    description:
      "The sales CRM you will actually use. Nothing to set up, nothing to learn.",
    // Installed, it opens on the board rather than the marketing page.
    start_url: "/pipeline",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#231f20",
    // Tints the Android status bar to match the app's own chrome.
    theme_color: "#16293d",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android crops this to a circle, so it carries its own padding.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
