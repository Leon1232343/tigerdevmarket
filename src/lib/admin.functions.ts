import { createServerFn } from "@tanstack/react-start";
import type { AdWithStats } from "./ads";

export type AdminBoost = { sellerId: string; username: string; expiresAt: string };
export type AdminPinnedOffer = { offerId: number; seller: string; pinnedAt: string | null };

export type AdminData = {
  ads: AdWithStats[];
  boosts: AdminBoost[];
  pinned: AdminPinnedOffer[];
};

export type AdminResult =
  { status: "guest" } | { status: "denied" } | { status: "ok"; data: AdminData };

/**
 * Everything /admin renders, in one round trip. The session and the owner check
 * both happen here on the server, so no server-only module is ever pulled into
 * the route's client bundle.
 */
export const fetchAdminData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminResult> => {
    const [{ optionalSessionUser }, { isOwner }] = await Promise.all([
      import("./session-user.server"),
      import("./owner.server"),
    ]);

    const user = await optionalSessionUser();
    if (!user) return { status: "guest" };
    if (!isOwner(user)) return { status: "denied" };

    const ads = await import("./ads.server");
    const [list, boosts, pinned] = await Promise.all([
      ads.listAdsWithStats(),
      ads.listBoosts(),
      ads.listPinnedOffers(),
    ]);
    return { status: "ok", data: { ads: list, boosts, pinned } };
  },
);

export const adminCreateAd = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      advertiser: string;
      title: string;
      description: string;
      targetUrl: string;
      categories: string;
      maxClicks: number;
      expiresAt: string;
      mediaUrl: string;
    }) => ({
      advertiser: String(input?.advertiser ?? "").trim(),
      title: String(input?.title ?? "").trim(),
      description: String(input?.description ?? "").trim(),
      targetUrl: String(input?.targetUrl ?? "").trim(),
      categories: String(input?.categories ?? "").trim(),
      maxClicks: Number.isFinite(input?.maxClicks) ? Number(input.maxClicks) : 0,
      expiresAt: String(input?.expiresAt ?? "").trim(),
      mediaUrl: String(input?.mediaUrl ?? "").trim(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireOwner } = await import("./owner.server");
    await requireOwner();

    const { createAd } = await import("./ads.server");
    const expires = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expires && Number.isNaN(expires.getTime())) throw new Error("Invalid expiry date.");

    const id = await createAd({
      ...data,
      expiresAt: expires ? expires.toISOString() : null,
    });
    return { id };
  });

export const adminSetAdActive = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number; active: boolean }) => ({
    id: Math.floor(Number(input?.id)),
    active: Boolean(input?.active),
  }))
  .handler(async ({ data }) => {
    const { requireOwner } = await import("./owner.server");
    await requireOwner();

    const { setAdActive } = await import("./ads.server");
    await setAdActive(data.id, data.active);
    return { ok: true };
  });

export const adminDeleteAd = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => ({ id: Math.floor(Number(input?.id)) }))
  .handler(async ({ data }) => {
    const { requireOwner } = await import("./owner.server");
    await requireOwner();

    const { deleteAd } = await import("./ads.server");
    await deleteAd(data.id);
    return { ok: true };
  });

export const adminPinOffer = createServerFn({ method: "POST" })
  .inputValidator((input: { offerId: number; pinned: boolean }) => ({
    offerId: Math.floor(Number(input?.offerId)),
    pinned: Boolean(input?.pinned),
  }))
  .handler(async ({ data }) => {
    const { requireOwner } = await import("./owner.server");
    await requireOwner();

    const { setOfferPinned } = await import("./ads.server");
    await setOfferPinned(data.offerId, data.pinned);
    return { ok: true };
  });

export const adminBoostSeller = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerId: string; days: number }) => ({
    sellerId: String(input?.sellerId ?? "").trim(),
    days: Math.min(Math.max(Math.floor(Number(input?.days) || 0), 1), 365),
  }))
  .handler(async ({ data }) => {
    const { requireOwner } = await import("./owner.server");
    await requireOwner();

    const { boostSeller } = await import("./ads.server");
    await boostSeller(data.sellerId, data.days);
    return { ok: true };
  });

export const adminRemoveBoost = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerId: string }) => ({
    sellerId: String(input?.sellerId ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    const { requireOwner } = await import("./owner.server");
    await requireOwner();

    const { removeBoost } = await import("./ads.server");
    await removeBoost(data.sellerId);
    return { ok: true };
  });
