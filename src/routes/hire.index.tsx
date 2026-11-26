import { createFileRoute } from "@tanstack/react-router";
import { HireIndexPage } from "@/components/market/HireLanding";
import { HIRE_PAGES, hirePath } from "@/lib/hire-content";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";

const TITLE = "Hire Roblox Developers — Tiger Market";
const DESCRIPTION =
  "Hire Roblox scripters, builders, UI designers, 3D modelers, GFX artists, animators, VFX artists and audio engineers. Live offers, ratings and direct contact.";

export const Route = createFileRoute("/hire/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/hire` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/hire` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/hire` },
      { rel: "alternate", hrefLang: "de", href: `${SITE_URL}/de/hire` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/hire` },
    ],
    scripts: [
      breadcrumbJsonLd([
        { name: "Offers", path: "/" },
        { name: "Hire developers", path: "/hire" },
      ]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/hire`,
          hasPart: HIRE_PAGES.map((page) => ({
            "@type": "WebPage",
            name: page.en.h1,
            url: `${SITE_URL}${hirePath(page, "en")}`,
          })),
        }),
      },
    ],
  }),
  component: () => <HireIndexPage locale="en" />,
});
