import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Stars } from "@/components/market/Stars";
import { OfferCard } from "@/components/market/OfferCard";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { fetchSeller } from "@/lib/offers.functions";
import { relativeTime } from "@/lib/offer-format";
import { SITE_URL, breadcrumbJsonLd, socialImageMeta } from "@/lib/site";

export const Route = createFileRoute("/seller/$sellerId")({
  loader: async ({ params }) => {
    const seller = await fetchSeller({ data: { sellerId: params.sellerId } });
    if (!seller) throw notFound();
    return { seller };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/seller/${params.sellerId}`;
    const s = loaderData?.seller;
    const title = s
      ? `${s.name} — Roblox developer profile · Tiger Market`
      : "Seller profile — Tiger Market";
    const description = s
      ? `${s.name} has ${s.activeOffers} active offer${s.activeOffers === 1 ? "" : "s"} on Tiger Market${s.categories.length ? ` in ${s.categories.slice(0, 3).join(", ")}` : ""}.`
      : "Roblox developer profile on Tiger Market.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...socialImageMeta,
        ...(s ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: s?.name ?? "Seller", path: `/seller/${params.sellerId}` },
        ]),
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Could not load this profile. {error instanceof Error ? error.message : "Please try again."}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      This seller has no offers on Tiger Market.{" "}
      <Link to="/" className="text-accent">
        Browse offers
      </Link>
    </div>
  ),
  component: SellerPage,
});

function SellerPage() {
  const { seller } = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: seller.name }]} />
        <section className="surface mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-lg font-semibold text-accent"
            >
              {seller.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{seller.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {seller.verified ? (
                  <span className="chip border-gold/40 text-gold">Verified ✓</span>
                ) : (
                  <span className="chip">Not verified</span>
                )}
                {seller.reviews > 0 && (
                  <span className="chip border-accent/40 text-accent">
                    {seller.reviews} review{seller.reviews === 1 ? "" : "s"}
                  </span>
                )}
                {seller.memberSince && (
                  <span suppressHydrationWarning>
                    First offer {relativeTime(seller.memberSince)}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto">
              <Stars rating={seller.rating} reviews={seller.reviews} size="lg" />
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["Active offers", seller.activeOffers],
              ["All-time offers", seller.totalOffers],
              ["Reviews", seller.reviews],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border p-3">
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
                <dd className="font-mono text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          {seller.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {seller.categories.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </div>
          )}
          {!seller.verified && (
            <p className="mt-4 text-xs text-muted-foreground">
              This seller isn't verified. Never pay in full up front and keep agreements in writing.
            </p>
          )}
        </section>
        <h2 className="mt-8 mb-3 text-lg font-semibold">Active offers</h2>
        {seller.offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active offers in the last 30 days.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seller.offers.map((o) => (
              <OfferCard key={o.publicId} offer={o} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
