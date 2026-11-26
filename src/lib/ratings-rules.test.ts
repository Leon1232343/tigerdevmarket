import { describe, expect, it } from "vitest";
import { MAX_RATINGS_PER_DAY, normalizeScore, validateRating } from "./ratings-rules";

const ok = { score: 5, isSelf: false, alreadyRated: false, ratingsToday: 0 };

describe("validateRating", () => {
  it("accepts a first 1-5 star rating", () => {
    expect(validateRating(ok)).toBeNull();
    expect(validateRating({ ...ok, score: 1 })).toBeNull();
    expect(validateRating({ ...ok, score: "4" })).toBeNull();
  });

  it("rejects scores outside 1-5", () => {
    for (const score of [0, 6, -1, 3.5, "five", null, undefined, NaN]) {
      expect(validateRating({ ...ok, score }), String(score)).toMatch(/1 to 5/);
    }
  });

  it("rejects rating your own offer", () => {
    expect(validateRating({ ...ok, isSelf: true })).toMatch(/own offer/);
  });

  it("rejects a second rating for the same offer", () => {
    expect(validateRating({ ...ok, alreadyRated: true })).toMatch(/already rated/);
  });

  it("caps ratings per day", () => {
    expect(validateRating({ ...ok, ratingsToday: MAX_RATINGS_PER_DAY - 1 })).toBeNull();
    expect(validateRating({ ...ok, ratingsToday: MAX_RATINGS_PER_DAY })).toMatch(/per day/);
  });
});

describe("normalizeScore", () => {
  it("returns integers in range and null otherwise", () => {
    expect(normalizeScore(3)).toBe(3);
    expect(normalizeScore("5")).toBe(5);
    expect(normalizeScore(7)).toBeNull();
    expect(normalizeScore("3.2")).toBeNull();
  });
});
