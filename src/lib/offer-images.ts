/**
 * Client-safe helpers for offer thumbnails.
 * Images are served through /api/public/img, which validates the upstream host,
 * asks Discord's CDN for a resized WebP variant and caches the result at the edge.
 */

/** Upstream hosts we are willing to proxy. Anything else is dropped (SSRF guard). */
export const ALLOWED_IMAGE_HOSTS = new Set([
  "cdn.discordapp.com",
  "media.discordapp.net",
  "images-ext-1.discordapp.net",
  "images-ext-2.discordapp.net",
  "i.imgur.com",
  "imgur.com",
  "tr.rbxcdn.com",
  "t0.rbxcdn.com",
  "t1.rbxcdn.com",
  "t2.rbxcdn.com",
  "t3.rbxcdn.com",
  "t4.rbxcdn.com",
  "t5.rbxcdn.com",
  "t6.rbxcdn.com",
  "t7.rbxcdn.com",
]);

/** Widths the proxy will generate — keeps the cache small and predictable. */
export const IMAGE_WIDTHS = [64, 128, 320, 640, 960, 1280] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export function isSupportedImageUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function proxyUrl(raw: string, width: ImageWidth): string {
  return `/api/public/img?w=${width}&u=${encodeURIComponent(raw)}`;
}

export type ResponsiveImage = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
};

/**
 * Build src/srcSet for a thumbnail rendered at `width` CSS px with the given aspect
 * ratio. Returns null when the URL is missing or not from a trusted host, so callers
 * can render nothing at all instead of a placeholder.
 */
export function responsiveOfferImage(
  raw: string | null | undefined,
  width: ImageWidth,
  aspect = 1,
): ResponsiveImage | null {
  if (!raw || !isSupportedImageUrl(raw)) return null;

  const retina = IMAGE_WIDTHS.find((candidate) => candidate >= width * 2) ?? width;
  const srcSet = [`${proxyUrl(raw, width)} 1x`];
  if (retina !== width) srcSet.push(`${proxyUrl(raw, retina)} 2x`);

  return {
    src: proxyUrl(raw, width),
    srcSet: srcSet.join(", "),
    width,
    height: Math.round(width / aspect),
  };
}
