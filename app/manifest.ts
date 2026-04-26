import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Geyvak",
    short_name: "Geyvak",
    description: "Compare clearly. Decide confidently.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f7f3",
    theme_color: "#244b43",
    categories: ["shopping", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
