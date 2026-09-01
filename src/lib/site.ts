/** Canonical site constants used for canonical URLs, social cards and JSON-LD. */
export const SITE_URL = "https://tigerdevmarket.lovable.app";
export const SITE_NAME = "Tiger Market";
export const OG_IMAGE = `${SITE_URL}/og-tiger-market.jpg`;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Shared og:image + twitter:image entries for a leaf route's head(). */
export const socialImageMeta = [
  { property: "og:image", content: OG_IMAGE },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { name: "twitter:image", content: OG_IMAGE },
] as const;

export type BreadcrumbTrail = { name: string; path: string }[];

/** BreadcrumbList JSON-LD script entry for a route's head(). */
export function breadcrumbJsonLd(trail: BreadcrumbTrail) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      })),
    }),
  };
}
