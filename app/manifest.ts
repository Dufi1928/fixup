import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestion Finances",
    short_name: "Finances",
    description: "Application de gestion financière partagée",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0ea5e9",
    theme_color: "#0ea5e9",
    lang: "fr-FR",
    icons: [
      // Idéalement fournir des PNG 192x192 et 512x512 dans /public
      {
        src: "/uploads/1762172591118-icon.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any"
      },
      {
        src: "/uploads/1762172591118-icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any"
      }
    ]
  };
}
