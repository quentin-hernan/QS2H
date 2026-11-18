import type { Metadata } from "next";
import { SITE_URL, isPlaceholder } from "./utils";
import type { SiteSettings } from "./defaults";

type Meta = { title: string; description: string; path: string; image?: string; type?: "website" | "article"; noindex?: boolean; publishedTime?: string };

export function buildMetadata({ title, description, path, image, type = "website", noindex, publishedTime }: Meta): Metadata {
  const url = `${SITE_URL}${path}`;
  const og = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : `${SITE_URL}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url, siteName: "QS2H", locale: "fr_FR", type, images: [{ url: og, width: 1200, height: 630 }], ...(publishedTime ? { publishedTime } : {}) },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

const abs = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

export function orgJsonLd(s: SiteSettings, rating?: { value: number; count: number } | null) {
  const c = s.company;
  const sameAs = Object.values(s.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    name: c.name,
    description: "Agence de création de sites web pour entreprises : sites vitrines, sur mesure, refonte, e-commerce, référencement SEO et maintenance.",
    url: SITE_URL,
    logo: abs("/logo.png"),
    image: abs("/opengraph-image"),
    email: c.email,
    ...(isPlaceholder(c.phone) ? {} : { telephone: c.phone }),
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      ...(isPlaceholder(c.address) ? {} : { streetAddress: c.address }),
      ...(isPlaceholder(c.zip) ? {} : { postalCode: c.zip }),
      addressLocality: c.city,
      addressCountry: "FR",
    },
    areaServed: [{ "@type": "City", name: c.city }, { "@type": "AdministrativeArea", name: "Charente-Maritime" }, { "@type": "Country", name: "France" }],
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" }],
    ...(sameAs.length ? { sameAs } : {}),
    ...(rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.value, reviewCount: rating.count } } : {}),
  };
}

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "QS2H",
  inLanguage: "fr-FR",
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
});

export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});

export const serviceJsonLd = (s: { title: string; tagline: string; slug: string; priceFrom: number }) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: s.title,
  description: s.tagline,
  url: `${SITE_URL}/services/${s.slug}`,
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: { "@type": "Country", name: "France" },
  offers: { "@type": "Offer", priceCurrency: "EUR", price: s.priceFrom, priceSpecification: { "@type": "PriceSpecification", minPrice: s.priceFrom, priceCurrency: "EUR" } },
});

export const articleJsonLd = (p: { title: string; excerpt: string; slug: string; cover: string; author: string; publishedAt: Date | null; updatedAt: Date }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: p.title,
  description: p.excerpt,
  mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
  image: p.cover ? abs(p.cover) : abs("/opengraph-image"),
  author: { "@type": "Organization", name: p.author },
  publisher: { "@id": `${SITE_URL}/#organization` },
  datePublished: p.publishedAt?.toISOString(),
  dateModified: p.updatedAt.toISOString(),
  inLanguage: "fr-FR",
});

export const creativeWorkJsonLd = (p: { title: string; summary: string; slug: string; cover: string; client: string; url: string }) => ({
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: p.title,
  description: p.summary,
  url: `${SITE_URL}/realisations/${p.slug}`,
  image: p.cover ? abs(p.cover) : undefined,
  creator: { "@id": `${SITE_URL}/#organization` },
  about: p.client,
  ...(p.url ? { sameAs: p.url } : {}),
});
