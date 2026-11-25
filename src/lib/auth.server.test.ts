import { describe, expect, it } from "vitest";
import { readCookie, RETURN_TO_COOKIE, sanitizeReturnTo } from "./auth.server";

const ORIGIN = "https://tigermarket.example";

/** Reproduces the login -> cookie -> callback round trip in the OAuth flow. */
function throughCookie(value: string): string {
  const request = new Request(`${ORIGIN}/api/auth/discord/callback`, {
    headers: { cookie: `${RETURN_TO_COOKIE}=${encodeURIComponent(value)}` },
  });
  // login.ts sanitizes, callback.ts decodes the cookie and sanitizes again.
  const fromCookie = decodeURIComponent(readCookie(request, RETURN_TO_COOKIE) ?? "/");
  return sanitizeReturnTo(fromCookie);
}

const bypasses = [
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "/\\/evil.example",
  "/\t/evil.example",
  "/\n/evil.example",
  "/\u0000evil.example",
  "javascript:alert(1)",
  "evil.example",
];

// These only leave the origin once a browser (or the callback) decodes them.
const encodedBypasses = ["/%5C%5Cevil.example", "/%09/evil.example"];

describe("sanitizeReturnTo", () => {
  it("accepts same-origin relative paths", () => {
    expect(sanitizeReturnTo("/post-offer")).toBe("/post-offer");
    expect(sanitizeReturnTo("/offers/123?tab=reviews#top")).toBe("/offers/123?tab=reviews#top");
    expect(sanitizeReturnTo("/")).toBe("/");
  });

  it("falls back to / when there is nothing to return to", () => {
    expect(sanitizeReturnTo(null)).toBe("/");
    expect(sanitizeReturnTo("")).toBe("/");
  });

  it("rejects every off-origin payload the URL parser would follow", () => {
    for (const value of bypasses) {
      expect(sanitizeReturnTo(value), value).toBe("/");
    }
  });

  it("rejects payloads that only leave the origin after decoding", () => {
    for (const value of [...bypasses, ...encodedBypasses]) {
      expect(sanitizeReturnTo(decodeURIComponent(value)), value).toBe("/");
    }
  });

  it("never resolves to another origin through the full cookie round trip", () => {
    for (const value of [...bypasses, ...encodedBypasses]) {
      const location = throughCookie(value);
      expect(new URL(location, ORIGIN).origin, value).toBe(ORIGIN);
    }
  });

  it("keeps the round trip for a legitimate path", () => {
    const location = throughCookie("/post-offer");
    expect(location).toBe("/post-offer");
    expect(new URL(location, ORIGIN).href).toBe(`${ORIGIN}/post-offer`);
  });
});
