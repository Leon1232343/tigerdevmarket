import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { OfferCard } from "@/components/market/OfferCard";
import { CATEGORIES, OFFERS, POST_TYPES } from "@/lib/market-data";

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
          "Browse 1,200+ active offers for Roblox scripting, building, UI design, 3D modeling, GFX and animation work.",
      },
    ],
  }),
  component: HomePage,
});

const PER_PAGE = 6;

/** Bento tile sizing derived from listing volume — data-driven, not arbitrary. */
function tileSpan(listings: number) {
  if (listings >= 350) return "sm:col-span-2 sm:row-span-2";
  if (listings >= 250) return "sm:col-span-2";
  if (listings >= 120) return "sm:row-span-2";
  return "";
}

function HomePage() {
  const [heroQuery, setHeroQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [postType, setPostType] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    const term = (query || heroQuery).trim().toLowerCase();
    return OFFERS.filter((offer) => {
      if (category !== "all" && offer.category !== category) return false;
      if (postType !== "all" && offer.postType !== postType) return false;
      if (
        term &&
        !`${offer.title} ${offer.excerpt} ${offer.seller} ${offer.category}`
          .toLowerCase()
          .includes(term)
      )
        return false;
      return true;
    });
  }, [category, postType, query, heroQuery]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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
              synced from Discord and the web.
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
                value={heroQuery}
                onChange={(event) => reset(() => setHeroQuery(event.target.value))}
              />
              <a href="#offers" className="btn-accent sm:h-11 sm:px-6">
                Search
              </a>
            </form>

            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono text-foreground/80">1,200</span> active offers
              <span aria-hidden="true">·</span>
              <span className="font-mono text-foreground/80">340</span> matches today
              <span aria-hidden="true">·</span>
              <span className="text-gold">4.6★</span> avg rating
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
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => reset(() => setCategory(cat.name))}
                aria-pressed={category === cat.name}
                className={`surface surface-hover flex flex-col items-start justify-between p-4 text-left ${tileSpan(
                  cat.listings,
                )} ${category === cat.name ? "border-accent bg-accent-soft" : ""}`}
              >
                <span aria-hidden="true" className="text-xl text-accent">
                  {cat.icon}
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold">{cat.name}</span>
                  <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                    {cat.listings} listings
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Offer listing grid */}
        <section id="offers" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">Latest offers</h2>

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
                {CATEGORIES.map((cat) => (
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

          {visible.length > 0 ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((offer) => (
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
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span className="font-mono text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-ghost disabled:opacity-40"
                  disabled={currentPage === totalPages}
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
              <h3 className="text-base font-semibold">No offers match those filters</h3>
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
                    setHeroQuery("");
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
