import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SiteNav } from "@/components/market/SiteNav";
import { SafetyBanner } from "@/components/market/SafetyBanner";
import { SiteFooter } from "@/components/market/SiteFooter";
import { OfferCard } from "@/components/market/OfferCard";
import { SaveSearchButton } from "@/components/market/SaveSearchButton";
import { SponsoredCard } from "@/components/market/SponsoredCard";
import { POST_TYPES } from "@/lib/market-data";
import {
  CURRENCIES,
  EXAMPLE_QUERIES,
  PAYMENT_FILTERS,
  SORT_OPTIONS,
  normalizeFilters,
} from "@/lib/offer-filters";
import { fetchMarketOverview, fetchOffers, type OfferListInput } from "@/lib/offers.functions";
import { smartSearch } from "@/lib/smart-search.functions";
import { fetchSponsoredAd } from "@/lib/ads.functions";
import { SITE_URL, socialImageMeta } from "@/lib/site";
import { sanitizeSavedSearchParams } from "@/lib/library-params";

const overviewQuery = queryOptions({
  queryKey: ["market-overview"],
  queryFn: () => fetchMarketOverview(),
  staleTime: 60_000,
});

const PER_PAGE = 12;
const DEFAULT_INPUT: OfferListInput = {
  category: "all",
  postType: "all",
  search: "",
  page: 1,
  perPage: PER_PAGE,
  ...normalizeFilters({}),
};

function offersQuery(input: OfferListInput) {
  return queryOptions({
    queryKey: ["offers", input],
    queryFn: () => fetchOffers({ data: input }),
    staleTime: 30_000,
  });
}

function sponsoredQuery(category: string) {
  return queryOptions({
    queryKey: ["sponsored-ad", category],
    queryFn: () => fetchSponsoredAd({ data: { category } }),
    staleTime: 60_000,
  });
}

function smartQueryOptions(search: string, page: number) {
  return queryOptions({
    queryKey: ["smart-search", search, page],
    queryFn: () => smartSearch({ data: { search, page, perPage: PER_PAGE } }),
    enabled: search.trim().length > 0,
    staleTime: 60_000,
  });
}

// Filters stay optional so a bare "/" keeps an empty search string. Injecting
// defaults here would rewrite the URL on every visit (307 to the fully
// parametrised variant); the defaults are applied where the values are used.
const optionalString = z.string().optional().catch(undefined);
const optionalNumber = z.number().optional().catch(undefined);

const searchSchema = z.object({
  cat: optionalString,
  type: optionalString,
  q: optionalString,
  ai: optionalString,
  page: z.number().int().optional().catch(undefined),
  sort: optionalString,
  min: optionalNumber,
  max: optionalNumber,
  cur: optionalString,
  pay: z.string().array().optional().catch(undefined),
  verified: z.boolean().optional().catch(undefined),
  images: z.boolean().optional().catch(undefined),
});
type HomeSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
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
      { property: "og:url", content: SITE_URL + "/" },
      { name: "twitter:card", content: "summary_large_image" },
      ...socialImageMeta,
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Tiger Market",
          url: SITE_URL + "/",
          potentialAction: {
            "@type": "SearchAction",
            target: SITE_URL + "/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  loader: async ({ context }) => {
    const [overview, initialOffers, initialSponsored] = await Promise.all([
      context.queryClient.ensureQueryData(overviewQuery),
      context.queryClient.ensureQueryData(offersQuery(DEFAULT_INPUT)),
      // Impression is counted server-side while rendering this page.
      context.queryClient.ensureQueryData(sponsoredQuery("all")),
    ]);
    return { overview, initialOffers, initialSponsored };
  },

  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Could not load offers right now.{" "}
      {error instanceof Error ? error.message : "Please try again."}
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
  const { overview: initialOverview, initialOffers, initialSponsored } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { cat: category = "all", type: postType = "all", ai: smartTerm = "", page = 1 } = search;
  const [query, setQuery] = useState(search.q || search.ai || "");
  const [minDraft, setMinDraft] = useState(search.min?.toString() ?? "");
  const [maxDraft, setMaxDraft] = useState(search.max?.toString() ?? "");

  useEffect(() => setQuery(search.q ?? search.ai ?? ""), [search.q, search.ai]);
  useEffect(() => {
    setMinDraft(search.min?.toString() ?? "");
    setMaxDraft(search.max?.toString() ?? "");
  }, [search.min, search.max]);

  function update(patch: Partial<HomeSearch>, keepPage = false) {
    void navigate({
      search: (prev) => ({ ...prev, ...patch, ...(keepPage ? {} : { page: 1 }) }),
      replace: true,
      resetScroll: false,
    });
  }

  // Debounce keyword typing into the URL.
  useEffect(() => {
    if (smartTerm || query === search.q) return;
    const id = setTimeout(() => update({ q: query }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filters = normalizeFilters({
    sort: search.sort,
    minPrice: search.min,
    maxPrice: search.max,
    currency: search.cur,
    payments: search.pay,
    verifiedOnly: search.verified,
    withImages: search.images,
  });
  const input: OfferListInput = {
    category,
    postType,
    search: search.q ?? "",
    page,
    perPage: PER_PAGE,
    ...filters,
  };
  const isDefaultView = JSON.stringify(input) === JSON.stringify(DEFAULT_INPUT);
  const smartActive = smartTerm.trim().length > 0;

  const { data: overview } = useQuery({ ...overviewQuery, initialData: initialOverview });
  const { data: browseData, isFetching: browseFetching } = useQuery({
    ...offersQuery(input),
    ...(isDefaultView ? { initialData: initialOffers } : {}),
    enabled: !smartActive,
    placeholderData: (previous) => previous,
  });
  const {
    data: smartData,
    isFetching: smartFetching,
    error: smartError,
  } = useQuery({
    ...smartQueryOptions(smartTerm, page),
    placeholderData: (previous) => previous,
  });

  const data = smartActive ? smartData : browseData;

  // Ads are matched to the category being browsed; smart search runs untargeted.
  const adCategory = smartActive ? "all" : category;
  const { data: sponsored } = useQuery({
    ...sponsoredQuery(adCategory),
    ...(adCategory === "all" ? { initialData: initialSponsored } : {}),
    placeholderData: (previous) => previous,
  });

  const isFetching = smartActive ? smartFetching : browseFetching;
  const interpretation = smartActive ? smartData?.interpretation : undefined;
  const offers = data?.offers ?? [];
  const totalPages = data?.totalPages ?? 1;
  const maxListings = Math.max(...overview.categories.map((cat) => cat.listings), 1);
  const currencyLabel = CURRENCIES.find((c) => c.value === filters.currency)?.label ?? "Robux";

  function runSmart(term: string) {
    setQuery(term);
    update({ ai: term.trim(), q: "" });
    document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
  }

  const chips: { key: string; label: string; clear: Partial<HomeSearch> }[] = [];
  if (category !== "all") chips.push({ key: "cat", label: category, clear: { cat: "all" } });
  if (postType !== "all")
    chips.push({
      key: "type",
      label: POST_TYPES.find((t) => t.value === postType)?.label ?? postType,
      clear: { type: "all" },
    });
  if (search.q) chips.push({ key: "q", label: `“${search.q}”`, clear: { q: "" } });
  if (filters.minPrice !== null)
    chips.push({
      key: "min",
      label: `≥ ${filters.minPrice.toLocaleString("en-US")} ${currencyLabel}`,
      clear: { min: undefined },
    });
  if (filters.maxPrice !== null)
    chips.push({
      key: "max",
      label: `≤ ${filters.maxPrice.toLocaleString("en-US")} ${currencyLabel}`,
      clear: { max: undefined },
    });
  for (const p of filters.payments)
    chips.push({
      key: `pay-${p}`,
      label: PAYMENT_FILTERS.find((x) => x.value === p)?.label ?? p,
      clear: { pay: filters.payments.filter((x) => x !== p) },
    });
  if (filters.verifiedOnly)
    chips.push({ key: "verified", label: "Verified only", clear: { verified: false } });
  if (filters.withImages)
    chips.push({ key: "images", label: "With images", clear: { images: false } });
  if (filters.sort !== "newest")
    chips.push({
      key: "sort",
      label: `Sort: ${SORT_OPTIONS.find((o) => o.value === filters.sort)?.label}`,
      clear: { sort: "newest" },
    });

  function clearAll() {
    setQuery("");
    void navigate({ search: {}, replace: true, resetScroll: false });
  }

  function applyPrice() {
    const toNum = (v: string) =>
      v.trim() === "" || !Number.isFinite(Number(v))
        ? undefined
        : Math.max(0, Math.floor(Number(v)));
    update({ min: toNum(minDraft), max: toNum(maxDraft), ai: "" });
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <SafetyBanner />

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
                runSmart(query);
              }}
              role="search"
            >
              <label htmlFor="hero-search" className="sr-only">
                Ask for what you need — AI smart search
              </label>
              <input
                id="hero-search"
                type="search"
                name="q"
                className="field sm:h-11"
                placeholder="Ask anything — e.g. cheap builder for a tycoon game"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit" className="btn-accent sm:h-11 sm:px-6">
                {smartFetching ? "Thinking…" : "Smart search"}
              </button>
            </form>
            <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="chip surface-hover cursor-pointer"
                  onClick={() => runSmart(example)}
                >
                  {example}
                </button>
              ))}
            </div>

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
                onClick={() => update({ cat: category === cat.name ? "all" : cat.name, ai: "" })}
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
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {smartActive ? "Smart search results" : "Latest offers"}
            </h2>
            <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
              {(data?.total ?? 0).toLocaleString("en-US")} results
            </p>
          </div>

          {smartActive && (
            <div className="surface mt-4 flex flex-wrap items-center gap-2 p-4 text-xs">
              <span className="text-muted-foreground">
                {smartError
                  ? "Smart search unavailable — showing keyword results."
                  : smartFetching && !interpretation
                    ? "AI is reading your question…"
                    : interpretation?.aiFailed
                      ? interpretation.aiReason === "rate_limited"
                        ? "Search limit reached — keyword results:"
                        : "AI unavailable — matching by keywords:"
                      : `AI understood${interpretation?.aiProvider ? ` (${interpretation.aiProvider})` : ""}:`}
              </span>
              {interpretation?.aiFailed && smartTerm && <span className="chip">{smartTerm}</span>}
              {interpretation?.category && <span className="chip">{interpretation.category}</span>}
              {interpretation?.postType && (
                <span className="chip">
                  {POST_TYPES.find((t) => t.value === interpretation.postType)?.label ??
                    interpretation.postType}
                </span>
              )}
              {interpretation?.verifiedOnly && <span className="chip">Verified sellers</span>}
              {interpretation?.maxPrice != null && (
                <span className="chip font-mono">
                  ≤ R$ {interpretation.maxPrice.toLocaleString("en-US")}
                </span>
              )}
              {interpretation?.keywords.map((keyword) => (
                <span key={keyword} className="chip">
                  {keyword}
                </span>
              ))}
              <button
                type="button"
                className="btn-ghost ml-auto"
                onClick={() => {
                  setQuery("");
                  update({ ai: "" });
                }}
              >
                Clear smart search
              </button>
            </div>
          )}

          <div className="surface mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filter-category" className="sr-only">
                Category
              </label>
              <select
                id="filter-category"
                className="field"
                value={category}
                onChange={(event) => update({ cat: event.target.value, ai: "" })}
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
                onChange={(event) => update({ type: event.target.value, ai: "" })}
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
              <label htmlFor="filter-sort" className="sr-only">
                Sort by
              </label>
              <select
                id="filter-sort"
                className="field"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value, ai: "" })}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
                placeholder="Keyword search…"
                value={query}
                onChange={(event) => {
                  if (smartActive) update({ ai: "" });
                  setQuery(event.target.value);
                }}
              />
            </div>

            <form
              className="flex items-center gap-2 sm:col-span-2"
              onSubmit={(event) => {
                event.preventDefault();
                applyPrice();
              }}
            >
              <label htmlFor="filter-min" className="sr-only">
                Minimum price
              </label>
              <input
                id="filter-min"
                inputMode="numeric"
                className="field font-mono"
                placeholder="Min"
                value={minDraft}
                onChange={(e) => setMinDraft(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={applyPrice}
              />
              <span aria-hidden="true" className="text-muted-foreground">
                –
              </span>
              <label htmlFor="filter-max" className="sr-only">
                Maximum price
              </label>
              <input
                id="filter-max"
                inputMode="numeric"
                className="field font-mono"
                placeholder="Max"
                value={maxDraft}
                onChange={(e) => setMaxDraft(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={applyPrice}
              />
              <div role="group" aria-label="Currency" className="flex shrink-0 gap-1">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={filters.currency === c.value}
                    className={`chip cursor-pointer ${filters.currency === c.value ? "border-accent text-accent" : ""}`}
                    onClick={() => update({ cur: c.value, ai: "" })}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </form>

            <div
              role="group"
              aria-label="Payment method"
              className="flex flex-wrap items-center gap-1 sm:col-span-2"
            >
              <span className="mr-1 text-xs text-muted-foreground">Payment:</span>
              {PAYMENT_FILTERS.map((p) => {
                const on = filters.payments.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={on}
                    className={`chip cursor-pointer ${on ? "border-accent text-accent" : ""}`}
                    onClick={() =>
                      update({
                        pay: on
                          ? filters.payments.filter((x) => x !== p.value)
                          : [...filters.payments, p.value],
                        ai: "",
                      })
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
              <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="accent-[var(--accent)]"
                  checked={filters.verifiedOnly}
                  onChange={(e) => update({ verified: e.target.checked, ai: "" })}
                />
                Verified only
              </label>
              <label className="ml-3 flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="accent-[var(--accent)]"
                  checked={filters.withImages}
                  onChange={(e) => update({ images: e.target.checked, ai: "" })}
                />
                With images
              </label>
            </div>
          </div>

          {chips.length > 0 && !smartActive && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="chip cursor-pointer border-accent/50"
                  onClick={() => {
                    if (chip.key === "q") setQuery("");
                    update(chip.clear);
                  }}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={clearAll}>
                Clear all
              </button>
              <span className="ml-auto">
                <SaveSearchButton
                  params={sanitizeSavedSearchParams({
                    cat: category,
                    type: postType,
                    q: search.q,
                    sort: filters.sort,
                    min: filters.minPrice,
                    max: filters.maxPrice,
                    cur: filters.currency,
                    pay: filters.payments,
                    verified: filters.verifiedOnly,
                    images: filters.withImages,
                  })}
                />
              </span>
            </div>
          )}

          {offers.length > 0 ? (
            <>
              <div
                className={`mt-6 grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
                  isFetching ? "opacity-60" : ""
                }`}
              >
                {offers.slice(0, 3).map((offer) => (
                  <OfferCard key={offer.publicId} offer={offer} />
                ))}
                {sponsored && <SponsoredCard key={`ad-${sponsored.id}`} ad={sponsored} />}
                {offers.slice(3).map((offer) => (
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
                  disabled={page <= 1}
                  onClick={() => update({ page: Math.max(1, page - 1) }, true)}
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
                  onClick={() => update({ page: page + 1 }, true)}
                >
                  Next →
                </button>
              </nav>
            </>
          ) : isFetching ? (
            <div
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading offers"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="surface h-44 animate-pulse p-4">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="mt-4 h-4 w-4/5 rounded bg-muted" />
                  <div className="mt-2 h-3 w-full rounded bg-muted" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="surface mt-6 flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span aria-hidden="true" className="text-3xl">
                🐯
              </span>
              <h3 className="text-base font-semibold">No offers found</h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                Try broader filters — or post your own offer and let developers find you.
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <button type="button" className="btn-ghost" onClick={clearAll}>
                  Clear filters
                </button>
                <Link to="/post-offer" className="btn-accent">
                  Post an offer
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
