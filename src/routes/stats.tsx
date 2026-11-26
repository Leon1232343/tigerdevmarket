import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { Stars } from "@/components/market/Stars";
import { DiscordButton } from "@/components/market/DiscordButton";
import { relativeTime } from "@/lib/offer-format";
import { fetchPublicStats } from "@/lib/offers.functions";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";

const TITLE = "Marketplace stats — Tiger Market";
const DESCRIPTION =
  "Live Tiger Market numbers: offers listed, active developers, new offers in the last 24 hours and the best-rated sellers.";

export const Route = createFileRoute("/stats")({
  loader: async () => await fetchPublicStats(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/stats` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/stats` }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Offers", path: "/" },
        { name: "Stats", path: "/stats" },
      ]),
    ],
  }),
  component: StatsPage,
});

function format(value: number): string {
  return value.toLocaleString("en-US");
}

function StatsPage() {
  const data = Route.useLoaderData();
  const { totals, categories, topSellers } = data;
  const maxListings = Math.max(...categories.map((category) => category.listings), 1);

  const cards = [
    {
      label: "Offers listed",
      value: format(totals.offers),
      note: `${format(totals.today)} in 24h`,
    },
    {
      label: "Developers",
      value: format(totals.sellers),
      note: `${format(totals.week)} offers this week`,
    },
    { label: "Reviews", value: format(totals.reviews), note: "1–5 stars, one per buyer" },
    {
      label: "Average rating",
      value: totals.avgRating > 0 ? `${totals.avgRating.toFixed(1)}★` : "—",
      note: totals.reviews > 0 ? "across all rated offers" : "no ratings yet",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Stats" }]} />

        <section className="mt-6">
          <p className="chip">Live numbers</p>
          <h1 className="mt-4 text-3xl leading-tight font-bold sm:text-5xl">Marketplace stats</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            These numbers come straight from the live marketplace — offers posted to the Discord bot
            and to this site. Nothing is estimated or cached between page views.
          </p>
          {totals.newest && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Newest offer posted {relativeTime(totals.newest)}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="surface p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{card.value}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{card.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-12" aria-labelledby="stats-categories">
          <h2 id="stats-categories" className="text-xl font-semibold">
            Offers by category
          </h2>
          <div className="surface mt-4 divide-y divide-border">
            {categories.map((category) => (
              <div key={category.slug} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span aria-hidden="true" className="w-5 shrink-0 text-accent">
                  {category.icon}
                </span>
                <span className="w-36 shrink-0 truncate">{category.name}</span>
                <span
                  aria-hidden="true"
                  className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:block"
                >
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${Math.round((category.listings / maxListings) * 100)}%` }}
                  />
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                  {format(category.listings)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            An offer can sit in several categories, so the counts overlap.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="stats-sellers">
          <h2 id="stats-sellers" className="text-xl font-semibold">
            Best-rated sellers
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            At least three reviews, highest average first.
          </p>

          {topSellers.length === 0 ? (
            <p className="surface mt-4 p-4 text-sm text-muted-foreground">
              Not enough ratings yet — rate a seller after your next deal to start this list.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {topSellers.map((seller, index) => (
                <li key={seller.sellerId} className="surface flex flex-wrap items-center gap-3 p-4">
                  <span className="font-mono text-xs text-muted-foreground">{index + 1}.</span>
                  <Link
                    to="/seller/$sellerId"
                    params={{ sellerId: seller.sellerId }}
                    className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:text-accent hover:underline"
                  >
                    {seller.name}
                  </Link>
                  <Stars rating={seller.rating} reviews={seller.reviews} />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {seller.offers} offer{seller.offers === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="surface mt-12 flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-semibold">Get your offer in these numbers</h2>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            Posting is free and syncs with the Discord bot, so your listing shows up on the site and
            in the server at the same time.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/post-offer" className="btn-accent">
              Post an offer
            </Link>
            <Link to="/hire" className="btn-ghost">
              Hire developers
            </Link>
            <DiscordButton label="Join our Discord" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
