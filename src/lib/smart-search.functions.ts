import { createServerFn } from "@tanstack/react-start";

export type SmartSearchInput = {
  search: string;
  page?: number;
  perPage?: number;
};

export const smartSearch = createServerFn({ method: "GET" })
  .inputValidator((input: SmartSearchInput) => ({
    search: String(input?.search ?? "").slice(0, 300),
    page: Number.isFinite(input?.page) ? Math.max(1, Math.floor(Number(input?.page))) : 1,
    perPage: Number.isFinite(input?.perPage) ? Math.floor(Number(input?.perPage)) : 12,
  }))
  .handler(async ({ data }) => {
    const { smartSearchOffers, indexPendingOffers } = await import("@/lib/smart-search.server");
    const result = await smartSearchOffers(data);
    // Keep the semantic index fresh, but never make the user wait for it.
    void indexPendingOffers(10).catch((error) => {
      console.error("Smart search index top-up failed", error);
    });
    return result;
  });
