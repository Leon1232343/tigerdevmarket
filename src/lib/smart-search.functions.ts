import { createServerFn } from "@tanstack/react-start";

export type SmartSearchInput = {
  search: string;
  page?: number;
  perPage?: number;
};

// Every search spends one AI request, so the endpoint carries its own limiter.
// Past the budget the search still answers — it just stops calling the model.
// Counters are per isolate, so this blunts spamming rather than guaranteeing a
// global cap; the providers' own 429s are the second line of defence.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_MAX_KEYS = 5_000;
const rateLimitHits = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request | undefined): string {
  if (!request) return "unknown";
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Returns true when this caller is over its budget for the current window. */
function isRateLimited(key: string, now: number): boolean {
  const entry = rateLimitHits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (rateLimitHits.size >= RATE_LIMIT_MAX_KEYS) rateLimitHits.clear();
    rateLimitHits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export const smartSearch = createServerFn({ method: "GET" })
  .inputValidator((input: SmartSearchInput) => ({
    search: String(input?.search ?? "").slice(0, 300),
    page: Number.isFinite(input?.page) ? Math.max(1, Math.floor(Number(input?.page))) : 1,
    perPage: Number.isFinite(input?.perPage) ? Math.floor(Number(input?.perPage)) : 12,
  }))
  .handler(async ({ data }) => {
    let limited = false;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      limited = isRateLimited(clientKey(getRequest()), Date.now());
    } catch {
      // Without a request context (e.g. prerender) there is nothing to limit.
    }

    const { smartSearchOffers } = await import("@/lib/smart-search.server");
    return smartSearchOffers({ ...data, skipAi: limited });
  });
