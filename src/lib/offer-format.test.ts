import { describe, it, expect } from "vitest";
import { formatPrice, cleanTitle, relativeTime, isExpired, PRICE_ON_REQUEST } from "./offer-format";

const p = (price_display: string | null, price_min: number | null = null, price_max: number | null = null) =>
  formatPrice({ price_display, price_min, price_max });

describe("formatPrice", () => {
  it("hides absurd grouped numbers like 200,500,500", () => expect(p("200,500,500")).toBe(PRICE_ON_REQUEST));
  it("hides Robux below 10 (R$ 1–2)", () => expect(p("R$ 1–2")).toBe(PRICE_ON_REQUEST));
  it("hides R$ 3", () => expect(p("R$ 3")).toBe(PRICE_ON_REQUEST));
  it("keeps a normal display price", () => expect(p("$10")).toBe("$10"));
  it("keeps 5,000 Robux", () => expect(p("5,000 Robux")).toBe("5,000 Robux"));
  it("min = max = 0 is price on request", () => expect(p(null, 0, 0)).toBe(PRICE_ON_REQUEST));
  it("formats Robux ranges with separators", () => expect(p(null, 1000, 2500)).toBe("R$ 1,000–2,500"));
  it("hides Robux above 5,000,000", () => expect(p(null, 6_000_000, 6_000_000)).toBe(PRICE_ON_REQUEST));
});

describe("cleanTitle", () => {
  it("strips tags and emojis", () =>
    expect(cleanTitle("[HIRING] Looking for: ⚡ Lunar Lighting Studio is recruiting! ⚡")).toBe(
      "Looking for: Lunar Lighting Studio is recruiting!",
    ));
  it("strips box drawing", () => expect(cleanTitle("╭━━━ Scripter for hire ━━━╮")).toBe("Scripter for hire"));
  it("limits to 70 chars", () => expect(cleanTitle("a".repeat(120)).length).toBe(70));
});

describe("dates", () => {
  const now = Date.parse("2026-01-31T12:00:00Z");
  it("shows hours", () => expect(relativeTime("2026-01-31T10:00:00Z", now)).toBe("2h ago"));
  it("older than 30 days is expired", () => expect(isExpired("2025-12-31T11:00:00Z", now)).toBe(true));
  it("29 days is not expired", () => expect(isExpired("2026-01-02T12:00:00Z", now)).toBe(false));
});
