/**
 * Client-safe advertising types and helpers. Anything that touches the database
 * lives in `ads.server.ts`.
 *
 * Ads are labelled "Sponsored" everywhere they appear: in Germany (and most of
 * the EU) paid placement has to be identifiable as advertising.
 */

export type Ad = {
  id: number;
  advertiser: string;
  title: string;
  description: string;
  categories: string[];
  mediaUrl: string | null;
  videoUrl: string | null;
  pricePerClick: number;
  maxClicks: number;
  expiresAt: string | null;
  active: boolean;
};

export type AdWithStats = Ad & {
  targetUrl: string | null;
  impressions: number;
  clicks: number;
  uniqueClicks: number;
};

export type AdStatus = "active" | "paused" | "expired" | "budget";

const AD_STATUS_LABEL: Record<AdStatus, string> = {
  active: "Active",
  paused: "Paused",
  expired: "Expired",
  budget: "Click budget spent",
};

export function adStatusLabel(status: AdStatus): string {
  return AD_STATUS_LABEL[status];
}

export const MAX_AD_TITLE = 60;
export const MAX_AD_DESCRIPTION = 200;

export function normalizeAdCategory(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * An ad without targeting runs everywhere; a targeted ad only runs on matching
 * categories. Broad browses (no category / "all") get untargeted ads only, the
 * same rule the Discord bot uses.
 */
export function matchesAdCategory(
  ad: Pick<Ad, "categories">,
  category: string | null | undefined,
): boolean {
  const targets = ad.categories.map(normalizeAdCategory).filter(Boolean);
  if (targets.length === 0) return true;

  const current = normalizeAdCategory(category);
  if (!current || current === "all") return false;
  return targets.some((target) => current.includes(target) || target.includes(current));
}

export function adStatus(
  ad: Pick<Ad, "active" | "expiresAt" | "maxClicks">,
  countedClicks: number,
  now = Date.now(),
): AdStatus {
  if (!ad.active) return "paused";
  if (ad.expiresAt && Date.parse(ad.expiresAt) <= now) return "expired";
  if (ad.maxClicks > 0 && countedClicks >= ad.maxClicks) return "budget";
  return "active";
}

/** Only http(s) targets are allowed, so a stored value can never become javascript: or data:. */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function adHref(adId: number | string): string {
  return `/go/${Number(adId)}`;
}
