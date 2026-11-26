import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { HireLandingPage } from "@/components/market/HireLanding";
import { normalizeFilters } from "@/lib/offer-filters";
import { fetchOffers } from "@/lib/offers.functions";
import { faqJsonLd, findHirePage, hirePath } from "@/lib/hire-content";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";

export const Route = createFileRoute("/de/hire/$slug")({
  loader: async ({ params }) => {
    const page = findHirePage(params.slug);
    if (!page) throw notFound();

    const data = await fetchOffers({
      data: {
        category: page.category,
        postType: "all",
        search: "",
        page: 1,
        perPage: 6,
        ...normalizeFilters({ sort: "newest" }),
      },
    });
    return { offers: data.offers };
  },

  head: ({ params }) => {
    const page = findHirePage(params.slug);
    if (!page) {
      return {
        meta: [
          { title: "Roblox-Entwickler engagieren — Tiger Market" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const copy = page.de;
    const en = `${SITE_URL}${hirePath(page, "en")}`;
    const de = `${SITE_URL}${hirePath(page, "de")}`;

    return {
      meta: [
        { title: copy.metaTitle },
        { name: "description", content: copy.metaDescription },
        { property: "og:title", content: copy.metaTitle },
        { property: "og:description", content: copy.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: de },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        { rel: "canonical", href: de },
        { rel: "alternate", hrefLang: "de", href: de },
        { rel: "alternate", hrefLang: "en", href: en },
        { rel: "alternate", hrefLang: "x-default", href: en },
      ],
      scripts: [
        faqJsonLd(copy.faq),
        breadcrumbJsonLd([
          { name: "Offers", path: "/" },
          { name: "Entwickler finden", path: "/de/hire" },
          { name: copy.eyebrow, path: hirePath(page, "de") },
        ]),
      ],
    };
  },

  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Diese Rollenseite gibt es nicht.{" "}
      <Link to="/de/hire" className="text-accent">
        Alle Rollen ansehen
      </Link>
    </div>
  ),

  component: HireDeRoute,
});

function HireDeRoute() {
  const { slug } = Route.useParams();
  const { offers } = Route.useLoaderData();
  const page = findHirePage(slug);
  if (!page) return null;
  return <HireLandingPage page={page} locale="de" offers={offers} />;
}
