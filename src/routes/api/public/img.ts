import { createFileRoute } from "@tanstack/react-router";
import { ALLOWED_IMAGE_HOSTS, IMAGE_WIDTHS } from "@/lib/offer-images";

const ONE_YEAR = 60 * 60 * 24 * 365;
const MAX_BYTES = 6 * 1024 * 1024;

/** Discord serves resized/re-encoded variants from media.discordapp.net. */
function upstreamFor(url: URL, width: number): URL {
  if (url.hostname === "cdn.discordapp.com" || url.hostname === "media.discordapp.net") {
    const resized = new URL(url.toString());
    resized.hostname = "media.discordapp.net";
    resized.searchParams.set("width", String(width));
    resized.searchParams.set("format", "webp");
    resized.searchParams.set("quality", "lossless");
    return resized;
  }
  if (url.hostname.endsWith("rbxcdn.com")) return url;
  return url;
}

export const Route = createFileRoute("/api/public/img")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const raw = params.get("u") ?? "";
        const width = Number(params.get("w") ?? 0);

        if (!IMAGE_WIDTHS.includes(width as (typeof IMAGE_WIDTHS)[number])) {
          return new Response("Bad width", { status: 400 });
        }

        let source: URL;
        try {
          source = new URL(raw);
        } catch {
          return new Response("Bad URL", { status: 400 });
        }
        if (source.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(source.hostname)) {
          return new Response("Forbidden host", { status: 403 });
        }

        const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
        const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
        const cached = await cache?.match(cacheKey);
        if (cached) return cached;

        let upstream: Response;
        try {
          upstream = await fetch(upstreamFor(source, width).toString(), {
            headers: { accept: "image/webp,image/avif,image/*" },
          });
        } catch {
          return new Response("Upstream unavailable", { status: 502 });
        }

        const type = upstream.headers.get("content-type") ?? "";
        if (!upstream.ok || !type.startsWith("image/")) {
          return new Response("Not an image", { status: 404 });
        }
        const length = Number(upstream.headers.get("content-length") ?? 0);
        if (length > MAX_BYTES) return new Response("Too large", { status: 413 });

        const body = await upstream.arrayBuffer();
        const response = new Response(body, {
          headers: {
            "content-type": type,
            "content-length": String(body.byteLength),
            "cache-control": `public, max-age=${ONE_YEAR}, immutable`,
            "x-content-type-options": "nosniff",
          },
        });
        await cache?.put(cacheKey, response.clone()).catch(() => {});
        return response;
      },
    },
  },
});
