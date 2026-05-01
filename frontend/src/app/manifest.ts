import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WarpFix — Autonomous CI Repair Agent",
    short_name: "WarpFix",
    description:
      "Detect CI failures, generate safe patches, validate in sandboxes, and open PRs automatically. Terminal-native intelligence for your pipeline.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#635bff",
    orientation: "portrait-primary",
    categories: ["developer tools", "productivity", "utilities"],
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
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/landing.png",
        sizes: "1280x720",
        type: "image/png",
      },
      {
        src: "/screenshots/dashboard.png",
        sizes: "1280x720",
        type: "image/png",
      },
    ],
  };
}
