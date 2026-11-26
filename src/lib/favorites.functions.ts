import { createServerFn } from "@tanstack/react-start";
import { parseOfferId } from "@/lib/library-params";

export type ToggleFavoriteInput = { offerId: string; favorite: boolean };

/** Favorite ids for the signed-in member; empty for guests. */
export const fetchFavoriteIds = createServerFn({ method: "GET" }).handler(async () => {
  const { optionalSessionUser } = await import("./session-user.server");
  const user = await optionalSessionUser();
  if (!user) return [] as string[];

  const { listFavoriteIds } = await import("./library.server");
  return listFavoriteIds(user.publicId);
});

/** The saved offers themselves, in the order they were saved. */
export const fetchFavoriteOffers = createServerFn({ method: "GET" }).handler(async () => {
  const { optionalSessionUser } = await import("./session-user.server");
  const user = await optionalSessionUser();
  if (!user) return [];

  const { listFavoriteIds } = await import("./library.server");
  const { listOffersByIds } = await import("./offers.server");
  return listOffersByIds(await listFavoriteIds(user.publicId));
});

export const toggleFavorite = createServerFn({ method: "POST" })
  .inputValidator((input: ToggleFavoriteInput) => ({
    offerId: parseOfferId(input?.offerId) ?? "",
    favorite: input?.favorite === true,
  }))
  .handler(async ({ data }) => {
    if (!data.offerId) throw new Error("Invalid offer.");

    const { requireSessionUser } = await import("./session-user.server");
    const user = await requireSessionUser();
    const { addFavorite, removeFavorite } = await import("./library.server");

    if (data.favorite) await addFavorite(user.publicId, data.offerId);
    else await removeFavorite(user.publicId, data.offerId);

    return { offerId: data.offerId, favorite: data.favorite };
  });
