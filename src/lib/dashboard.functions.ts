import { createServerFn } from "@tanstack/react-start";
import type { Offer } from "@/lib/market-data";
import type { SavedSearchParams } from "@/lib/library-params";

export type DashboardSavedSearch = {
  id: string;
  label: string;
  params: SavedSearchParams;
  createdAt: string;
  lastSeenAt: string;
  newMatches: number;
};

export type DashboardRating = {
  offerId: string;
  title: string;
  score: number;
  createdAt: string | null;
};

export type DashboardData = {
  offers: Offer[];
  favorites: Offer[];
  savedSearches: DashboardSavedSearch[];
  ratings: DashboardRating[];
  totalNewMatches: number;
};

/** Everything the dashboard needs, in one round trip. Null for guests. */
export const fetchDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData | null> => {
    const [{ optionalSessionUser }, library, offersDb, ratingsDb, matcher] = await Promise.all([
      import("./session-user.server"),
      import("./library.server"),
      import("./offers.server"),
      import("./ratings.server"),
      import("./saved-search-match"),
    ]);

    const user = await optionalSessionUser();
    if (!user) return null;

    const [offers, favoriteIds, savedSearches, myRatings] = await Promise.all([
      offersDb.listOffersBySeller(user.discordId),
      library.listFavoriteIds(user.publicId),
      library.listSavedSearches(user.publicId),
      ratingsDb.listMyRatings(user.discordId),
    ]);

    // Oldest baseline across all saved searches: one offers query feeds every
    // "new matches" count instead of one query per saved search.
    const baseline = savedSearches.reduce((oldest, entry) => {
      const parsed = Date.parse(entry.lastSeenAt);
      return Number.isFinite(parsed) && parsed < oldest ? parsed : oldest;
    }, Date.now());

    const ratedIds = [...new Set(myRatings.map((rating) => rating.offerId))];

    const [favorites, newOffers, ratedOffers] = await Promise.all([
      offersDb.listOffersByIds(favoriteIds),
      savedSearches.length > 0
        ? offersDb.listOffersForMatching(new Date(baseline).toISOString())
        : Promise.resolve([]),
      ratedIds.length > 0 ? offersDb.listOffersByIds(ratedIds) : Promise.resolve([]),
    ]);

    const byId = new Map(ratedOffers.map((offer) => [offer.publicId, offer]));
    const ratings: DashboardRating[] = myRatings.map((rating) => ({
      offerId: rating.offerId,
      title: byId.get(rating.offerId)?.title ?? `Offer #${rating.offerId}`,
      score: rating.score,
      createdAt: rating.createdAt,
    }));

    const searches: DashboardSavedSearch[] = savedSearches.map((entry) => ({
      id: entry.id,
      label: entry.label,
      params: entry.params,
      createdAt: entry.createdAt,
      lastSeenAt: entry.lastSeenAt,
      newMatches: newOffers.filter((offer) => matcher.matchesSavedSearch(offer, entry.params))
        .length,
    }));

    return {
      offers,
      favorites,
      savedSearches: searches,
      ratings,
      totalNewMatches: searches.reduce((total, entry) => total + entry.newMatches, 0),
    };
  },
);

/** Resets the "new matches" baseline once the member opened the saved searches. */
export const markSavedSearchesSeen = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async () => {
    const { optionalSessionUser } = await import("./session-user.server");
    const user = await optionalSessionUser();
    if (!user) return { ok: false };

    const { touchSavedSearches } = await import("./library.server");
    await touchSavedSearches(user.publicId);
    return { ok: true };
  });
