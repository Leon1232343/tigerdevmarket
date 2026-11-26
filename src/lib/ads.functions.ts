import { createServerFn } from "@tanstack/react-start";
import type { Ad } from "./ads";

/**
 * One sponsored slot for a page view. Picking and counting the impression happen
 * on the server, so an ad blocker cannot hide the numbers from us.
 */
export const fetchSponsoredAd = createServerFn({ method: "GET" })
  .inputValidator((input: { category?: string } | undefined) => ({
    category: typeof input?.category === "string" ? input.category.slice(0, 60) : "all",
  }))
  .handler(async ({ data }): Promise<Ad | null> => {
    const { pickSponsoredAd } = await import("./ads.server");
    return pickSponsoredAd(data.category);
  });
