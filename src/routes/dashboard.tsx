import { useEffect, useState } from "react";
import { createFileRoute, Link, useLoaderData, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { OfferCard } from "@/components/market/OfferCard";
import { Stars } from "@/components/market/Stars";
import { isExpired, relativeTime } from "@/lib/offer-format";
import { savedSearchHref } from "@/lib/library-params";
import {
  deleteMyOffer,
  fetchDashboard,
  markSavedSearchesSeen,
  type DashboardData,
} from "@/lib/dashboard.functions";
import { deleteSavedSearch } from "@/lib/saved-searches.functions";
import type { SessionUser } from "@/lib/auth.server";

const TABS = [
  { value: "offers", label: "My offers" },
  { value: "favorites", label: "Favorites" },
  { value: "searches", label: "Saved searches" },
  { value: "ratings", label: "Ratings" },
] as const;
type TabValue = (typeof TABS)[number]["value"];

function isTab(value: unknown): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

export const Route = createFileRoute("/dashboard")({
  // Optional so every `to="/dashboard"` link typechecks without a search param.
  validateSearch: (search: Record<string, unknown>): { tab?: TabValue } =>
    isTab(search["tab"]) ? { tab: search["tab"] } : {},
  loader: async (): Promise<{ data: DashboardData | null }> => ({
    data: await fetchDashboard(),
  }),
  head: () => ({
    meta: [
      { title: "Your dashboard — Tiger Market" },
      {
        name: "description",
        content: "Your Tiger Market offers, saved offers, saved searches and the ratings you gave.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = Route.useLoaderData();
  const { user } = useLoaderData({ from: "__root__" }) as { user: SessionUser | null };
  const { tab = "offers" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const markSeen = useServerFn(markSavedSearchesSeen);
  const removeSearch = useServerFn(deleteSavedSearch);
  const removeOffer = useServerFn(deleteMyOffer);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  useEffect(() => {
    // Counts are shown relative to the last visit; opening the tab is the visit.
    if (tab !== "searches" || !data) return;
    void markSeen({ data: {} }).catch(() => undefined);
  }, [tab, data, markSeen]);

  async function onDelete(id: string) {
    setSearchError(null);
    try {
      await removeSearch({ data: { id } });
      await router.invalidate();
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "Could not delete this search.");
    }
  }

  async function onDeleteOffer(offerId: string) {
    if (!window.confirm("Delete this offer? It disappears from the marketplace for everyone."))
      return;
    setOfferError(null);
    try {
      await removeOffer({ data: { offerId } });
      await router.invalidate();
    } catch (cause) {
      setOfferError(cause instanceof Error ? cause.message : "Could not delete this offer.");
    }
  }

  const counts: Record<TabValue, number> = {
    offers: data?.offers.length ?? 0,
    favorites: data?.favorites.length ?? 0,
    searches: data?.totalNewMatches ?? 0,
    ratings: data?.ratings.length ?? 0,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Your dashboard
        </h1>

        {!data || !user ? (
          <section className="surface mt-6 p-6 sm:p-8">
            <h2 className="text-base font-semibold">Sign in to see your dashboard</h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
              Your offers, saved offers, saved searches and ratings are tied to your Discord
              account.
            </p>
            <a
              href="/api/auth/discord/login?returnTo=%2Fdashboard"
              rel="nofollow"
              className="btn-accent mt-5"
            >
              <span aria-hidden="true">◈</span> Continue with Discord
            </a>
          </section>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName ?? user.username} profile picture`}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 rounded-full border border-border"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-sm font-semibold text-accent"
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-medium">{user.displayName ?? user.username}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {data.offers.length} offers · {data.favorites.length} saved ·{" "}
                  {data.savedSearches.length} searches · {data.ratings.length} ratings
                </p>
              </div>
              <Link to="/post-offer" className="btn-accent ml-auto text-xs">
                Post an offer
              </Link>
            </div>

            <div
              className="mt-6 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Dashboard sections"
            >
              {TABS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.value}
                  className={`chip cursor-pointer ${
                    tab === entry.value ? "border-accent text-accent" : ""
                  }`}
                  onClick={() => void navigate({ search: { tab: entry.value }, replace: true })}
                >
                  {entry.label}
                  {counts[entry.value] > 0 && (
                    <span className="ml-1 font-mono text-[11px]">{counts[entry.value]}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {tab === "offers" && (
                <OffersTab data={data} error={offerError} onDelete={onDeleteOffer} />
              )}
              {tab === "favorites" && <FavoritesTab data={data} />}
              {tab === "searches" && (
                <SearchesTab data={data} error={searchError} onDelete={onDelete} />
              )}
              {tab === "ratings" && <RatingsTab data={data} />}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface mt-4 flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden="true" className="text-2xl">
        🐯
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

function OffersTab({
  data,
  error,
  onDelete,
}: {
  data: DashboardData;
  error: string | null;
  onDelete: (offerId: string) => Promise<void>;
}) {
  const live = data.offers.filter((offer) => !isExpired(offer.postedAt)).length;
  const expired = data.offers.length - live;

  return (
    <section aria-labelledby="dash-offers">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="dash-offers" className="text-lg font-semibold">
          My offers
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {live} live · {expired} expired
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive-foreground">
          {error}
        </p>
      )}

      {data.offers.length === 0 ? (
        <EmptyState
          title="No offers yet"
          body="Post your first offer and it shows up in the marketplace immediately."
          action={
            <Link to="/post-offer" className="btn-accent">
              Post an offer
            </Link>
          }
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.offers.map((offer) => (
            <div key={offer.publicId} className="flex flex-col gap-1.5">
              <OfferCard offer={offer} />
              <button
                type="button"
                className="btn-ghost self-end text-xs text-destructive-foreground"
                onClick={() => void onDelete(offer.publicId)}
                aria-label={`Delete offer ${offer.title}`}
              >
                Delete offer
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Offers older than 30 days stay listed here but drop out of the marketplace. Deleting an
        offer removes it everywhere, including from other members’ saved lists.
      </p>
    </section>
  );
}

function FavoritesTab({ data }: { data: DashboardData }) {
  return (
    <section aria-labelledby="dash-favorites">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="dash-favorites" className="text-lg font-semibold">
          Saved offers
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{data.favorites.length} saved</p>
      </div>

      {data.favorites.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Tap the heart on any offer to keep it here for later."
          action={
            <Link to="/" className="btn-ghost">
              Browse offers
            </Link>
          }
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.favorites.map((offer) => (
            <OfferCard key={offer.publicId} offer={offer} />
          ))}
        </div>
      )}
    </section>
  );
}

function SearchesTab({
  data,
  error,
  onDelete,
}: {
  data: DashboardData;
  error: string | null;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <section aria-labelledby="dash-searches">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="dash-searches" className="text-lg font-semibold">
          Saved searches
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {data.savedSearches.length} of 20 saved
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive-foreground">
          {error}
        </p>
      )}

      {data.savedSearches.length === 0 ? (
        <EmptyState
          title="No saved searches yet"
          body="Filter the marketplace, then use “Save this search” above the results."
          action={
            <Link to="/" className="btn-ghost">
              Go to the marketplace
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {data.savedSearches.map((entry) => (
            <li key={entry.id} className="surface flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Saved {relativeTime(entry.createdAt)}
                </p>
              </div>
              {entry.newMatches > 0 ? (
                <span className="chip border-accent/50 text-accent">
                  {entry.newMatches} new offer{entry.newMatches === 1 ? "" : "s"}
                </span>
              ) : (
                <span className="chip text-muted-foreground">No new offers</span>
              )}
              <a href={savedSearchHref(entry.params)} className="btn-ghost text-xs">
                Run search
              </a>
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => void onDelete(entry.id)}
                aria-label={`Delete saved search ${entry.label}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RatingsTab({ data }: { data: DashboardData }) {
  return (
    <section aria-labelledby="dash-ratings">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="dash-ratings" className="text-lg font-semibold">
          Ratings you gave
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{data.ratings.length} ratings</p>
      </div>

      {data.ratings.length === 0 ? (
        <EmptyState
          title="No ratings yet"
          body="After a deal, rate the offer to help other buyers."
          action={
            <Link to="/" className="btn-ghost">
              Find an offer
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {data.ratings.map((rating) => (
            <li
              key={`${rating.offerId}-${rating.createdAt ?? "x"}`}
              className="surface flex flex-wrap items-center gap-3 p-4"
            >
              <Link
                to="/offers/$offerId"
                params={{ offerId: rating.offerId }}
                className="min-w-0 flex-1 truncate text-sm underline-offset-4 hover:text-accent hover:underline"
              >
                {rating.title}
              </Link>
              <Stars rating={rating.score} reviews={1} />
              <time className="font-mono text-xs text-muted-foreground">
                {rating.createdAt ? relativeTime(rating.createdAt) : ""}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
