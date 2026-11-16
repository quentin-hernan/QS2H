import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QS2H — Solutions digitales",
    short_name: "QS2H",
    description: "Création de sites web pour entreprises.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0E11",
    theme_color: "#0C0E11",
    lang: "fr",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
