import { createFileRoute } from "@tanstack/react-router";
import {
  OAUTH_STATE_COOKIE,
  RETURN_TO_COOKIE,
  STATE_MAX_AGE,
  buildAuthorizeUrl,
  isDiscordConfigured,
  isSecureRequest,
  randomToken,
  sanitizeReturnTo,
  serializeCookie,
} from "@/lib/auth.server";

/**
 * Starts the Discord OAuth2 flow. Generates a CSRF `state` value, stores it in
 * a short-lived HttpOnly cookie (double-submit), and redirects to Discord.
 */

// Per-isolate limiter: it stops a single client from hammering the endpoint and
// filling the cookie jar, but a global limit still belongs in a Cloudflare Rate
// Limiting rule, because each Worker isolate keeps its own counters.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_MAX_KEYS = 5_000;
const rateLimitHits = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Returns 0 when allowed, otherwise the seconds the caller should wait. */
function rateLimitDelay(key: string, now: number): number {
  const entry = rateLimitHits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (rateLimitHits.size >= RATE_LIMIT_MAX_KEYS) rateLimitHits.clear();
    rateLimitHits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return 0;
  }
  entry.count += 1;
  if (entry.count <= RATE_LIMIT_MAX) return 0;
  return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
}
export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const retryAfter = rateLimitDelay(clientKey(request), Date.now());
        if (retryAfter > 0) {
          return new Response("Too many login attempts. Please wait a moment.", {
            status: 429,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Retry-After": String(retryAfter),
              "Cache-Control": "no-store",
            },
          });
        }

        if (!isDiscordConfigured()) {
          return new Response("Discord login is not configured yet.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        const state = randomToken();
        const secure = isSecureRequest(request);
        const returnTo = sanitizeReturnTo(new URL(request.url).searchParams.get("returnTo"));

        const headers = new Headers({ Location: buildAuthorizeUrl(request, state) });
        headers.append(
          "Set-Cookie",
          serializeCookie(OAUTH_STATE_COOKIE, state, { maxAge: STATE_MAX_AGE, secure }),
        );
        headers.append(
          "Set-Cookie",
          serializeCookie(RETURN_TO_COOKIE, encodeURIComponent(returnTo), {
            maxAge: STATE_MAX_AGE,
            secure,
          }),
        );

        return new Response(null, { status: 302, headers });
      },
    },
  },
});
