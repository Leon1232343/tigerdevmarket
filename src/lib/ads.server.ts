/**
 * Server-only advertising access.
 *
 * The `ads`, `ad_impressions` and `ad_clicks` tables are created and managed by
 * the Tiger Market Discord bot inside the offers database, so the site and the
 * bot share one inventory, one budget and one set of numbers. Nothing here
 * writes to Supabase.
 *
 * Reads degrade to "no ad" when the tables are missing, so a marketplace without
 * ads never breaks a page. Writes (admin) surface their errors to the caller.
 */
import { query } from "@/lib/offers.server";
import { matchesAdCategory, safeHttpUrl, type Ad, type AdWithStats } from "@/lib/ads";

type AdRow = {
  ad_id: number;
  advertiser: string | null;
  title: string | null;
  description: string | null;
  target_url: string | null;
  categories: string | null;
  active: number | boolean | null;
  price_per_click: number | string | null;
  max_clicks: number | null;
  expires_at: Date | string | null;
  media_url: string | null;
  video_url: string | null;
  counted_clicks?: number | string | null;
  impressions?: number | string | null;
  unique_clicks?: number | string | null;
};

/** Ad plus the fields only the server needs (target URL, counted clicks). */
export type AdRecord = Ad & { targetUrl: string | null; countedClicks: number };

const AD_COLUMNS = `a.ad_id, a.advertiser, a.title, a.description, a.target_url,
  a.categories, a.active, a.price_per_click, a.max_clicks, a.expires_at,
  a.media_url, a.video_url`;

/** Counted clicks per ad, shared by the servable and admin queries. */
const COUNTED_CLICKS = `(
  SELECT c.ad_id, COUNT(*)::int AS counted
    FROM ad_clicks c
   WHERE c.counted = 1
   GROUP BY c.ad_id
) cc`;

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function splitCategories(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toNumber(value: number | string | null | undefined): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function toAdRecord(row: AdRow): AdRecord {
  return {
    id: Number(row.ad_id),
    advertiser: (row.advertiser ?? "").trim() || "Tiger Market partner",
    title: (row.title ?? "").trim() || "Sponsored offer",
    description: (row.description ?? "").trim(),
    categories: splitCategories(row.categories),
    mediaUrl: safeHttpUrl(row.media_url),
    videoUrl: safeHttpUrl(row.video_url),
    pricePerClick: toNumber(row.price_per_click),
    maxClicks: toNumber(row.max_clicks),
    expiresAt: iso(row.expires_at),
    active: Boolean(row.active),
    targetUrl: safeHttpUrl(row.target_url),
    countedClicks: toNumber(row.counted_clicks),
  };
}

function withoutTarget(record: AdRecord): Ad {
  return {
    id: record.id,
    advertiser: record.advertiser,
    title: record.title,
    description: record.description,
    categories: record.categories,
    mediaUrl: record.mediaUrl,
    videoUrl: record.videoUrl,
    pricePerClick: record.pricePerClick,
    maxClicks: record.maxClicks,
    expiresAt: record.expiresAt,
    active: record.active,
  };
}

/**
 * Active, unexpired ads whose click budget is not spent yet. Category targeting
 * is applied in memory because `categories` is a plain comma list in the shared
 * bot schema.
 */
export async function listServableAds(category?: string | null): Promise<Ad[]> {
  try {
    const rows = await query<AdRow>(
      `SELECT ${AD_COLUMNS}, COALESCE(cc.counted, 0) AS counted_clicks
         FROM ads a
         LEFT JOIN ${COUNTED_CLICKS} ON cc.ad_id = a.ad_id
        WHERE a.active = 1
          AND (a.expires_at IS NULL OR a.expires_at > now())
          AND (COALESCE(a.max_clicks, 0) = 0 OR COALESCE(cc.counted, 0) < a.max_clicks)
        ORDER BY a.ad_id DESC
        LIMIT 50`,
    );

    return rows
      .map(toAdRecord)
      .filter((ad) => ad.targetUrl !== null && matchesAdCategory(ad, category))
      .map(withoutTarget);
  } catch (error) {
    console.warn("[ads] inventory unavailable", error);
    return [];
  }
}

export async function logAdImpression(adId: number): Promise<void> {
  try {
    await query("INSERT INTO ad_impressions (ad_id) VALUES ($1)", [adId]);
  } catch (error) {
    // Tracking must never break a page render.
    console.warn("[ads] impression not logged", error);
  }
}

/** Picks one matching ad, counts the impression and returns it. */
export async function pickSponsoredAd(category?: string | null): Promise<Ad | null> {
  const candidates = await listServableAds(category);
  if (candidates.length === 0) return null;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? candidates[0];
  if (!chosen) return null;
  await logAdImpression(chosen.id);
  return chosen;
}

/** The ad behind /go/:id — only when it may still be served. */
export async function getServableAd(adId: number): Promise<AdRecord | null> {
  if (!Number.isInteger(adId) || adId <= 0) return null;
  const rows = await query<AdRow>(
    `SELECT ${AD_COLUMNS}, COALESCE(cc.counted, 0) AS counted_clicks
       FROM ads a
       LEFT JOIN ${COUNTED_CLICKS} ON cc.ad_id = a.ad_id
      WHERE a.ad_id = $1
        AND a.active = 1
        AND (a.expires_at IS NULL OR a.expires_at > now())
        AND (COALESCE(a.max_clicks, 0) = 0 OR COALESCE(cc.counted, 0) < a.max_clicks)
      LIMIT 1`,
    [adId],
  );
  const row = rows[0];
  if (!row) return null;
  const ad = toAdRecord(row);
  return ad.targetUrl ? ad : null;
}

/**
 * Logs a click. Returns true when it counts (billable) and false when the same
 * visitor clicked this ad within the last 24 hours — identical to the bot's rule.
 */
export async function recordAdClick(adId: number, visitorKey: string): Promise<boolean> {
  const key = visitorKey.slice(0, 64);
  const rows = await query<{ counted: number | boolean }>(
    `INSERT INTO ad_clicks (ad_id, user_id, counted)
     SELECT $1, $2,
            CASE WHEN EXISTS (
              SELECT 1 FROM ad_clicks
               WHERE ad_id = $1 AND user_id = $2 AND counted = 1
                 AND timestamp > now() - interval '24 hours'
            ) THEN 0 ELSE 1 END
     RETURNING counted`,
    [adId, key],
  );
  return Boolean(rows[0]?.counted);
}

/* ------------------------------------------------------------------- admin */

export async function listAdsWithStats(): Promise<AdWithStats[]> {
  const rows = await query<AdRow>(
    `SELECT ${AD_COLUMNS},
            (SELECT COUNT(*)::int FROM ad_impressions i WHERE i.ad_id = a.ad_id) AS impressions,
            COALESCE(cc.counted, 0) AS counted_clicks,
            (SELECT COUNT(DISTINCT c.user_id)::int FROM ad_clicks c
              WHERE c.ad_id = a.ad_id AND c.counted = 1) AS unique_clicks
       FROM ads a
       LEFT JOIN ${COUNTED_CLICKS} ON cc.ad_id = a.ad_id
      ORDER BY a.ad_id DESC`,
  );

  return rows.map((row) => {
    const record = toAdRecord(row);
    return {
      ...withoutTarget(record),
      targetUrl: record.targetUrl,
      impressions: toNumber(row.impressions),
      clicks: record.countedClicks,
      uniqueClicks: toNumber(row.unique_clicks),
    };
  });
}

export type NewAdInput = {
  advertiser: string;
  title: string;
  description: string;
  targetUrl: string;
  categories: string;
  maxClicks: number;
  expiresAt: string | null;
  mediaUrl: string;
  /** Euro per counted click; 0 keeps a campaign free, which is what billing reports. */
  pricePerClick: number;
};

export async function createAd(input: NewAdInput): Promise<number> {
  const target = safeHttpUrl(input.targetUrl);
  if (!target) throw new Error("Target URL must start with http:// or https://");
  if (!input.advertiser.trim()) throw new Error("Advertiser name is required.");
  if (!input.title.trim()) throw new Error("Ad title is required.");

  const rows = await query<{ ad_id: number }>(
    `INSERT INTO ads (advertiser, title, description, target_url, categories, active,
                      price_per_click, max_clicks, expires_at, media_url, video_url)
     VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, '')
     RETURNING ad_id`,
    [
      input.advertiser.trim().slice(0, 80),
      input.title.trim().slice(0, 60),
      input.description.trim().slice(0, 200),
      target,
      input.categories.trim().slice(0, 200),
      Math.max(0, Number(input.pricePerClick) || 0),
      Math.max(0, Math.floor(input.maxClicks)),
      input.expiresAt,
      safeHttpUrl(input.mediaUrl) ?? "",
    ],
  );
  const id = rows[0]?.ad_id;
  if (!id) throw new Error("Could not save the ad.");
  return id;
}

export async function setAdActive(adId: number, active: boolean): Promise<void> {
  const rows = await query<{ ad_id: number }>(
    "UPDATE ads SET active = $2 WHERE ad_id = $1 RETURNING ad_id",
    [adId, active ? 1 : 0],
  );
  if (rows.length === 0) throw new Error("Ad not found.");
}

export async function deleteAd(adId: number): Promise<void> {
  await query("DELETE FROM ad_clicks WHERE ad_id = $1", [adId]);
  await query("DELETE FROM ad_impressions WHERE ad_id = $1", [adId]);
  const rows = await query<{ ad_id: number }>("DELETE FROM ads WHERE ad_id = $1 RETURNING ad_id", [
    adId,
  ]);
  if (rows.length === 0) throw new Error("Ad not found.");
}

export type PinnedOffer = { offerId: number; seller: string; pinnedAt: string | null };

export async function setOfferPinned(offerId: number, pinned: boolean): Promise<void> {
  const rows = await query<{ offer_id: number }>(
    "UPDATE offers SET is_pinned = $2 WHERE offer_id = $1 RETURNING offer_id",
    [offerId, pinned ? 1 : 0],
  );
  if (rows.length === 0) throw new Error("Offer not found.");
}

export async function listPinnedOffers(limit = 10): Promise<PinnedOffer[]> {
  const rows = await query<{
    offer_id: number;
    seller_username: string | null;
    timestamp: Date | string | null;
  }>(
    `SELECT offer_id, seller_username, timestamp
       FROM offers
      WHERE is_pinned = 1
      ORDER BY timestamp DESC NULLS LAST
      LIMIT $1`,
    [Math.min(Math.max(limit, 1), 50)],
  );
  return rows.map((row) => ({
    offerId: Number(row.offer_id),
    seller: (row.seller_username ?? "unknown").trim(),
    pinnedAt: iso(row.timestamp),
  }));
}

export type SellerBoost = { sellerId: string; username: string; expiresAt: string };

export async function boostSeller(sellerId: string, days: number): Promise<void> {
  if (!/^\d{5,25}$/.test(sellerId)) throw new Error("Seller ID must be a Discord user ID.");

  const [seller] = await query<{ seller_username: string | null }>(
    `SELECT (array_agg(seller_username ORDER BY timestamp DESC NULLS LAST))[1] AS seller_username
       FROM offers WHERE seller_id = $1`,
    [sellerId],
  );
  const username = (seller?.seller_username ?? "").trim() || sellerId;
  const duration = Math.min(Math.max(Math.floor(days), 1), 365);

  await query(
    `INSERT INTO boosted_users (user_id, username, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)
     ON CONFLICT (user_id) DO UPDATE
       SET username = EXCLUDED.username, expires_at = EXCLUDED.expires_at`,
    [sellerId, username.slice(0, 80), String(duration)],
  );
}

export async function removeBoost(sellerId: string): Promise<void> {
  try {
    await query("DELETE FROM boosted_users WHERE user_id = $1", [sellerId]);
  } catch (error) {
    console.warn("[ads] boost removal failed", error);
  }
}

export async function listBoosts(): Promise<SellerBoost[]> {
  try {
    const rows = await query<{ user_id: string; username: string; expires_at: Date | string }>(
      `SELECT user_id, username, expires_at FROM boosted_users
        WHERE expires_at > now()
        ORDER BY expires_at ASC`,
    );
    return rows.map((row) => ({
      sellerId: row.user_id,
      username: row.username,
      expiresAt: iso(row.expires_at) ?? "",
    }));
  } catch (error) {
    console.warn("[ads] boosts unavailable", error);
    return [];
  }
}
