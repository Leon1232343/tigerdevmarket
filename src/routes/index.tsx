import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { OfferCard } from "@/components/market/OfferCard";
import { POST_TYPES } from "@/lib/market-data";
import { fetchMarketOverview, fetchOffers, type OfferListInput } from "@/lib/offers.functions";

const overviewQuery = queryOptions({
  queryKey: ["market-overview"],
  queryFn: () => fetchMarketOverview(),
  staleTime: 60_000,
});

const PER_PAGE = 12;

function offersQuery(input: Required<OfferListInput>) {
  return queryOptions({
    queryKey: ["offers", input],
    queryFn: () => fetchOffers({ data: input }),
    staleTime: 30_000,
  });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tiger Market — Hire Roblox Developers & Sell Dev Services" },
      {
        name: "description",
        content:
          "Tiger Market is a marketplace for Roblox developers: hire scripters, builders, UI designers, modelers, GFX artists and animators, or list your own services.",
      },
      { property: "og:title", content: "Tiger Market — Roblox Developer Marketplace" },
      {
        property: "og:description",
        content:
          "Browse live offers for Roblox scripting, building, UI design, 3D modeling, GFX and animation work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(overviewQuery),
      context.queryClient.ensureQueryData(
        offersQuery({ category: "all", postType: "all", search: "", page: 1, perPage: PER_PAGE }),
      ),
    ]);
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Could not load offers right now. {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="px-4 py-24 text-center text-sm">Nothing here.</div>,
  component: HomePage,
});

/** Bento tile sizing derived from live listing volume — data-driven, not arbitrary. */
function tileSpan(listings: number, max: number) {
  const ratio = max > 0 ? listings / max : 0;
  if (ratio >= 0.8) return "sm:col-span-2 sm:row-span-2";
  if (ratio >= 0.5) return "sm:col-span-2";
  if (ratio >= 0.25) return "sm:row-span-2";
  return "";
}

function HomePage() {
  const [category, setCategory] = useState("all");
  const [postType, setPostType] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: overview } = useSuspenseQuery(overviewQuery);
  const { data, isFetching } = useQuery({
    ...offersQuery({ category, postType, search: query, page, perPage: PER_PAGE }),
    placeholderData: (previous) => previous,
  });

  const offers = data?.offers ?? [];
  const totalPages = data?.totalPages ?? 1;
  const maxListings = Math.max(...overview.categories.map((cat) => cat.listings), 1);

  function reset(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <p className="chip mx-auto">Roblox developer marketplace</p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] font-bold sm:text-6xl">
              Find the developer your game needs. Or get hired today.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Scripting, building, UI, modeling, GFX and animation — listed by real developers,
              synced live from Discord and the web.
            </p>

            <form
              className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
              role="search"
            >
              <label htmlFor="hero-search" className="sr-only">
                Search offers by keyword
              </label>
              <input
                id="hero-search"
                type="search"
                name="q"
                className="field sm:h-11"
                placeholder="Search offers — e.g. combat system, UI kit, animator"
                value={query}
                onChange={(event) => reset(() => setQuery(event.target.value))}
              />
              <a href="#offers" className="btn-accent sm:h-11 sm:px-6">
                Search
              </a>
            </form>

            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono text-foreground/80">
                {overview.stats.totalOffers.toLocaleString("en-US")}
              </span>{" "}
              live offers
              <span aria-hidden="true">·</span>
              <span className="font-mono text-foreground/80">{overview.stats.offersToday}</span> new
              in 24h
              <span aria-hidden="true">·</span>
              <span className="font-mono text-foreground/80">
                {overview.stats.sellers.toLocaleString("en-US")}
              </span>{" "}
              developers
              {overview.stats.avgRating > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-gold">{overview.stats.avgRating.toFixed(1)}★</span> avg
                  rating
                </>
              )}
            </p>
          </div>
        </section>

        {/* Category bento grid */}
        <section id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Browse by category</h2>
            <p className="text-xs text-muted-foreground">Tile size reflects active listings</p>
          </div>

          <div className="mt-6 grid auto-rows-[104px] grid-cols-2 gap-3 sm:grid-cols-4">
            {overview.categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => reset(() => setCategory(category === cat.name ? "all" : cat.name))}
                aria-pressed={category === cat.name}
                className={`surface surface-hover flex flex-col items-start justify-between p-4 text-left ${tileSpan(
                  cat.listings,
                  maxListings,
                )} ${category === cat.name ? "border-accent bg-accent-soft" : ""}`}
              >
                <span aria-hidden="true" className="text-xl text-accent">
                  {cat.icon}
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold">{cat.name}</span>
                  <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                    {cat.listings.toLocaleString("en-US")} listings
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Offer listing grid */}
        <section id="offers" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Latest offers</h2>
            <p className="font-mono text-xs text-muted-foreground">
              {(data?.total ?? 0).toLocaleString("en-US")} matching
            </p>
          </div>

          <div className="surface mt-6 grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <label htmlFor="filter-category" className="sr-only">
                Category
              </label>
              <select
                id="filter-category"
                className="field"
                value={category}
                onChange={(event) => reset(() => setCategory(event.target.value))}
              >
                <option value="all">All categories</option>
                {overview.categories.map((cat) => (
                  <option key={cat.slug} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-type" className="sr-only">
                Post type
              </label>
              <select
                id="filter-type"
                className="field"
                value={postType}
                onChange={(event) => reset(() => setPostType(event.target.value))}
              >
                <option value="all">All post types</option>
                {POST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-search" className="sr-only">
                Search offers
              </label>
              <input
                id="filter-search"
                type="search"
                className="field"
                placeholder="Search offers…"
                value={query}
                onChange={(event) => reset(() => setQuery(event.target.value))}
              />
            </div>
          </div>

          {offers.length > 0 ? (
            <>
              <div
                className={`mt-6 grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
                  isFetching ? "opacity-60" : ""
                }`}
              >
                {offers.map((offer) => (
                  <OfferCard key={offer.publicId} offer={offer} />
                ))}
              </div>

              <nav
                aria-label="Pagination"
                className="mt-8 flex items-center justify-center gap-3 text-sm"
              >
                <button
                  type="button"
                  className="btn-ghost disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <span className="font-mono text-xs text-muted-foreground">
                  Page {page} of {totalPages.toLocaleString("en-US")}
                </span>
                <button
                  type="button"
                  className="btn-ghost disabled:opacity-40"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </nav>
            </>
          ) : (
            <div className="surface mt-6 flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span aria-hidden="true" className="text-3xl">
                🐯
              </span>
              <h3 className="text-base font-semibold">
                {isFetching ? "Loading offers…" : "No offers match those filters"}
              </h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                Try a broader category or clear the search term.
              </p>
              <button
                type="button"
                className="btn-ghost mt-1"
                onClick={() =>
                  reset(() => {
                    setCategory("all");
                    setPostType("all");
                    setQuery("");
                  })
                }
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
