import { describe, expect, it } from "vitest";
import { matchesSavedSearch, sanePriceRange, type MatchableOffer } from "./saved-search-match";
import { sanitizeSavedSearchParams } from "./library-params";

function offer(overrides: Partial<MatchableOffer> = {}): MatchableOffer {
  return {
    publicId: "1",
    category: "Scripting",
    serviceType: "Scripting",
    postType: "forhire",
    body: "Experienced scripter for tycoon systems",
    seller: "tigerdev",
    priceText: "R$ 2,500",
    priceMin: 2500,
    priceMax: 2500,
    paymentMethod: "Robux, PayPal",
    imageUrl: null,
    verified: false,
    ...overrides,
  };
}

const params = (input: Record<string, unknown> = {}) => sanitizeSavedSearchParams(input);

describe("matchesSavedSearch", () => {
  it("matches everything with the default search", () => {
    expect(matchesSavedSearch(offer(), params())).toBe(true);
  });

  it("filters by category, post type and keyword", () => {
    expect(matchesSavedSearch(offer(), params({ cat: "Builder" }))).toBe(false);
    expect(matchesSavedSearch(offer(), params({ cat: "script" }))).toBe(true);
    expect(matchesSavedSearch(offer(), params({ type: "hiring" }))).toBe(false);
    expect(matchesSavedSearch(offer(), params({ type: "forhire" }))).toBe(true);
    expect(matchesSavedSearch(offer(), params({ q: "TYCOON" }))).toBe(true);
    expect(matchesSavedSearch(offer(), params({ q: "shader" }))).toBe(false);
  });

  it("honours the price window in the chosen currency", () => {
    expect(matchesSavedSearch(offer(), params({ max: 1000 }))).toBe(false);
    expect(matchesSavedSearch(offer(), params({ min: 1000 }))).toBe(true);
    expect(matchesSavedSearch(offer(), params({ min: 3000 }))).toBe(false);
    // A Robux-only price must not satisfy a USD search (and vice versa).
    const robuxOnly = offer({ priceText: "2,500 Robux" });
    expect(matchesSavedSearch(robuxOnly, params({ cur: "usd", max: 5000 }))).toBe(false);
    expect(matchesSavedSearch(robuxOnly, params({ cur: "robux", max: 5000 }))).toBe(true);
  });

  it("ignores offers without a sane price when a price filter is set", () => {
    const odd = offer({ priceText: "ask me", priceMin: 1, priceMax: 2 });
    expect(sanePriceRange(odd)).toBeNull();
    expect(matchesSavedSearch(odd, params({ max: 5000 }))).toBe(false);
  });

  it("filters by payment method, verified sellers and images", () => {
    expect(matchesSavedSearch(offer(), params({ pay: ["paypal"] }))).toBe(true);
    expect(matchesSavedSearch(offer(), params({ pay: ["crypto"] }))).toBe(false);
    expect(matchesSavedSearch(offer(), params({ verified: true }))).toBe(false);
    expect(matchesSavedSearch(offer({ verified: true }), params({ verified: true }))).toBe(true);
    expect(matchesSavedSearch(offer(), params({ images: true }))).toBe(false);
    expect(
      matchesSavedSearch(
        offer({ imageUrl: "https://cdn.example/x.png" }),
        params({ images: true }),
      ),
    ).toBe(true);
  });
});
