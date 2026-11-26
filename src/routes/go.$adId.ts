import { createFileRoute } from "@tanstack/react-router";

/**
 * Click-tracked ad redirect: /go/:adId
 *
 * The browser only ever sees this path, then lands on the advertiser's page.
 * Clicks are deduplicated per visitor for 24 hours, exactly like the bot, so
 * advertisers are not billed twice for one person.
 */
export const Route = createFileRoute("/go/$adId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const adId = Number(params.adId);
        if (!Number.isInteger(adId) || adId <= 0) {
          return new Response("Unknown ad.", { status: 404 });
        }

        const { getServableAd, recordAdClick } = await import("@/lib/ads.server");
        const ad = await getServableAd(adId).catch((error: unknown) => {
          console.error("[ads] redirect lookup failed", error);
          return null;
        });
        if (!ad?.targetUrl) {
          return new Response("This ad is no longer running.", {
            status: 404,
            headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
          });
        }

        let visitor = "";
        try {
          const { optionalSessionUser } = await import("@/lib/session-user.server");
          const user = await optionalSessionUser();
          visitor = user ? user.discordId : await anonymousVisitorKey(request);
        } catch {
          visitor = await anonymousVisitorKey(request);
        }

        await recordAdClick(adId, visitor).catch((error: unknown) => {
          // A lost click must never stop the visitor from reaching the ad.
          console.warn("[ads] click not logged", error);
          return false;
        });

        return new Response(null, {
          status: 302,
          headers: {
            Location: ad.targetUrl,
            "cache-control": "no-store",
            "referrer-policy": "no-referrer-when-downgrade",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});

/** Stable per-visitor key without storing an IP address. */
async function anonymousVisitorKey(request: Request): Promise<string> {
  const { createHash } = await import("node:crypto");
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip") || "";
  const agent = request.headers.get("user-agent") ?? "";
  return `web:${createHash("sha256").update(`${ip}|${agent}`).digest("hex").slice(0, 24)}`;
}
