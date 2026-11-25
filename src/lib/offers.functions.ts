import { createServerFn } from "@tanstack/react-start";
import { normalizeFilters, type BrowseFilters } from "@/lib/offer-filters";

export type OfferListInput = {
  category?: string;
  postType?: string;
  search?: string;
  page?: number;
  perPage?: number;
} & Partial<BrowseFilters>;

export const fetchOffers = createServerFn({ method: "GET" })
  .inputValidator((input: OfferListInput | undefined) => ({
    category: typeof input?.category === "string" ? input.category.slice(0, 60) : "all",
    postType: typeof input?.postType === "string" ? input.postType.slice(0, 30) : "all",
    search: typeof input?.search === "string" ? input.search.slice(0, 80) : "",
    page: Number.isFinite(input?.page) ? Math.max(1, Math.floor(Number(input?.page))) : 1,
    perPage: Number.isFinite(input?.perPage) ? Math.floor(Number(input?.perPage)) : 12,
    ...normalizeFilters(input),
  }))
  .handler(async ({ data }) => {
    const { listOffers } = await import("@/lib/offers.server");
    return listOffers(data);
  });

export const fetchOffer = createServerFn({ method: "GET" })
  .inputValidator((input: { offerId: string }) => ({ offerId: String(input.offerId).slice(0, 24) }))
  .handler(async ({ data }) => {
    const { getOfferById } = await import("@/lib/offers.server");
    return getOfferById(data.offerId);
  });

export const fetchMarketOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { getMarketOverview } = await import("@/lib/offers.server");
  return getMarketOverview();
});

export const fetchSeller = createServerFn({ method: "GET" })
  .inputValidator((input: { sellerId: string }) => ({ sellerId: String(input.sellerId).slice(0, 40) }))
  .handler(async ({ data }) => {
    const { getSellerProfile } = await import("@/lib/offers.server");
    return getSellerProfile(data.sellerId);
  });
