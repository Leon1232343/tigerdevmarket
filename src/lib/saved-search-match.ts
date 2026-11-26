/**
 * Pure matcher for saved searches: a new offer counts as a match when it would
 * appear in the same browse query. Mirrors `applyBrowseFilters` (SQL) closely
 * enough that the dashboard badge agrees with the marketplace list.
 */
import { CURRENCY_PATTERNS, PAYMENT_PATTERNS } from "@/lib/offer-filters";
import type { PostType } from "@/lib/market-data";
import type { SavedSearchParams } from "@/lib/library-params";

const SANE_MIN = 10;
const SANE_MAX = 5_000_000;

export type MatchableOffer = {
  publicId: string;
  category: string | null;
  serviceType: string | null;
  postType: PostType;
  body: string;
  seller: string | null;
  priceText: string | null;
  priceMin: number | null;
  priceMax: number | null;
  paymentMethod: string | null;
  imageUrl: string | null;
  verified: boolean;
};

/** Same sanity window as `formatPrice`/`sortSql`, so counts and cards agree. */
export function sanePriceRange(offer: Pick<MatchableOffer, "priceMin" | "priceMax">): {
  lo: number;
  hi: number;
} | null {
  const sane = (value: number | null): number | null =>
    value !== null && value >= SANE_MIN && value <= SANE_MAX ? value : null;
  const lo = sane(offer.priceMin) ?? sane(offer.priceMax);
  const hi = sane(offer.priceMax) ?? sane(offer.priceMin);
  if (lo === null || hi === null) return null;
  return { lo, hi };
}

function matchesAny(haystack: string, patterns: string[]): boolean {
  const text = haystack.toLowerCase();
  return patterns.some((pattern) => text.includes(pattern.replace(/%/g, "").toLowerCase()));
}

export function matchesSavedSearch(offer: MatchableOffer, params: SavedSearchParams): boolean {
  if (
    params.cat !== "all" &&
    !(offer.category ?? "").toLowerCase().includes(params.cat.toLowerCase())
  )
    return false;

  if (params.type !== "all" && offer.postType !== params.type) return false;

  if (params.q) {
    const haystack = [
      offer.body,
      offer.seller ?? "",
      offer.category ?? "",
      offer.serviceType ?? "",
      offer.priceText ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(params.q.toLowerCase())) return false;
  }

  if (params.min !== null || params.max !== null) {
    const range = sanePriceRange(offer);
    if (!range) return false;
    const currency = CURRENCY_PATTERNS[params.cur] ?? [];
    if (currency.length > 0 && !matchesAny(offer.priceText ?? "", currency)) return false;
    if (params.min !== null && range.hi < params.min) return false;
    if (params.max !== null && range.lo > params.max) return false;
  }

  const payPatterns = params.pay.flatMap((pay) => PAYMENT_PATTERNS[pay] ?? []);
  if (payPatterns.length > 0 && !matchesAny(offer.paymentMethod ?? "", payPatterns)) return false;

  if (params.verified && !offer.verified) return false;
  if (params.images && !(offer.imageUrl ?? "").toLowerCase().startsWith("http")) return false;

  return true;
}
