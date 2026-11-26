import { describe, expect, it } from "vitest";
import {
  buildSavedSearchLabel,
  isDefaultSavedSearch,
  parseOfferId,
  sanitizeSavedSearchParams,
  savedSearchHref,
  DEFAULT_SAVED_SEARCH_PARAMS,
} from "./library-params";

describe("sanitizeSavedSearchParams", () => {
  it("keeps known filters and drops unknown ones", () => {
    const params = sanitizeSavedSearchParams({
      cat: "Scripting",
      type: "hiring",
      q: "  tycoon  ",
      sort: "price_asc",
      cur: "usd",
      min: "100",
      max: "2500",
      pay: ["paypal", "bitcoin", "paypal"],
      verified: true,
      images: false,
    });
    expect(params).toEqual({
      cat: "Scripting",
      type: "hiring",
      q: "tycoon",
      sort: "price_asc",
      cur: "usd",
      min: 100,
      max: 2500,
      pay: ["paypal"],
      verified: true,
      images: false,
    });
  });

  it("falls back to defaults for junk input", () => {
    const params = sanitizeSavedSearchParams({
      cat: 42,
      sort: "sideways",
      cur: "doge",
      min: -5,
      max: "abc",
      pay: "paypal",
      verified: "yes",
    });
    expect(params).toEqual(DEFAULT_SAVED_SEARCH_PARAMS);
  });

  it("clamps prices to the sane marketplace range", () => {
    const params = sanitizeSavedSearchParams({ min: 1e12, max: 999.9 });
    expect(params.min).toBe(5_000_000);
    expect(params.max).toBe(999);
  });

  it("caps the query length", () => {
    expect(sanitizeSavedSearchParams({ q: "x".repeat(200) }).q).toHaveLength(80);
  });
});

describe("buildSavedSearchLabel", () => {
  it("describes the filters in plain words", () => {
    const label = buildSavedSearchLabel(
      sanitizeSavedSearchParams({
        cat: "Scripting",
        type: "forhire",
        q: "tycoon",
        max: 5000,
        verified: true,
      }),
    );
    expect(label).toBe("Scripting · For Hire · “tycoon” · ≤ 5,000 Robux · Verified only");
  });

  it("never exceeds 80 characters and is never empty", () => {
    expect(buildSavedSearchLabel(DEFAULT_SAVED_SEARCH_PARAMS)).toBe("All offers");
    const long = buildSavedSearchLabel(
      sanitizeSavedSearchParams({ cat: "c".repeat(60), q: "q".repeat(80) }),
    );
    expect(long.length).toBeLessThanOrEqual(80);
  });
});

describe("savedSearchHref", () => {
  it("round-trips through the marketplace URL", () => {
    const params = sanitizeSavedSearchParams({
      cat: "Building",
      type: "selling",
      q: "map",
      sort: "price_desc",
      cur: "eur",
      min: 50,
      pay: ["crypto"],
      verified: true,
      images: true,
    });
    const url = new URL(savedSearchHref(params), "https://tigermarket.example");
    const search = url.searchParams;
    expect(search.get("cat")).toBe("Building");
    expect(search.get("q")).toBe("map");
    expect(search.get("min")).toBe("50");
    expect(JSON.parse(search.get("pay") ?? "null")).toEqual(["crypto"]);
    expect(search.get("verified")).toBe("true");
    expect(search.get("images")).toBe("true");
    expect(url.pathname).toBe("/");
  });

  it("treats the default search as default after a round trip", () => {
    const url = new URL(savedSearchHref(DEFAULT_SAVED_SEARCH_PARAMS), "https://x.example");
    const roundTripped = sanitizeSavedSearchParams({
      cat: url.searchParams.get("cat"),
      type: url.searchParams.get("type"),
      q: url.searchParams.get("q"),
      sort: url.searchParams.get("sort"),
      cur: url.searchParams.get("cur"),
      pay: JSON.parse(url.searchParams.get("pay") ?? "[]"),
      verified: url.searchParams.get("verified") === "true",
      images: url.searchParams.get("images") === "true",
    });
    expect(isDefaultSavedSearch(roundTripped)).toBe(true);
  });
});

describe("parseOfferId", () => {
  it("accepts positive integer ids only", () => {
    expect(parseOfferId("42")).toBe("42");
    expect(parseOfferId(42)).toBe("42");
    expect(parseOfferId(" 007 ")).toBe("007");
  });

  it("rejects anything that is not a plain number", () => {
    for (const value of ["", "0x10", "1.5", "-3", "12abc", "1 OR 1=1", null, undefined, {}]) {
      expect(parseOfferId(value), String(value)).toBeNull();
    }
    expect(parseOfferId("9".repeat(25))).toBeNull();
  });
});
