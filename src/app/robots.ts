import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/compte", "/boutique/commande", "/boutique/panier", "/boutique/merci", "/contact/merci", "/rendez-vous/annuler/"] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
