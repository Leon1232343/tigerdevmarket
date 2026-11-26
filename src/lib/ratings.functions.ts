import { createServerFn } from "@tanstack/react-start";
import { parseOfferId } from "@/lib/library-params";

export const submitRating = createServerFn({ method: "POST" })
  .inputValidator((input: { offerId: string; score: number }) => ({
    offerId: parseOfferId(input?.offerId) ?? "",
    score: Number(input?.score),
  }))
  .handler(async ({ data }) => {
    if (!data.offerId) throw new Error("Invalid offer.");

    const { requireSessionUser } = await import("./session-user.server");
    const user = await requireSessionUser();
    const { rateOffer } = await import("./ratings.server");
    return rateOffer(user, data.offerId, data.score);
  });
