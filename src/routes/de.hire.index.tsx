import { createFileRoute } from "@tanstack/react-router";
import { HireIndexPage } from "@/components/market/HireLanding";
import { HIRE_PAGES, hirePath } from "@/lib/hire-content";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";

const TITLE = "Roblox-Entwickler engagieren — Tiger Market";
const DESCRIPTION =
  "Roblox-Scripter, Builder, UI-Designer, 3D-Modeler, GFX-Artists, Animatoren, VFX-Artists und Audio-Engineers finden. Aktuelle Angebote mit Bewertungen und direktem Kontakt.";

export const Route = createFileRoute("/de/hire/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/de/hire` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/de/hire` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/hire` },
      { rel: "alternate", hrefLang: "de", href: `${SITE_URL}/de/hire` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/hire` },
    ],
    scripts: [
      breadcrumbJsonLd([
        { name: "Offers", path: "/" },
        { name: "Entwickler finden", path: "/de/hire" },
      ]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/de/hire`,
          inLanguage: "de",
          hasPart: HIRE_PAGES.map((page) => ({
            "@type": "WebPage",
            name: page.de.h1,
            url: `${SITE_URL}${hirePath(page, "de")}`,
          })),
        }),
      },
    ],
  }),
  component: () => <HireIndexPage locale="de" />,
});
