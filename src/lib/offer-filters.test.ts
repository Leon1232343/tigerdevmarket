import { describe, expect, it } from "vitest";
import { applyBrowseFilters, normalizeFilters, sortSql } from "./offer-filters";

describe("browse filters", () => {
  it("defaults to newest with pinned first", () => {
    expect(normalizeFilters({}).sort).toBe("newest");
    expect(sortSql("newest")).toMatch(/^o\.is_pinned DESC/);
  });
  it("oldest sorts by timestamp ascending", () => {
    expect(sortSql("oldest")).toBe("o.timestamp ASC NULLS LAST");
  });
  it("unknown sort falls back to newest", () => {
    expect(normalizeFilters({ sort: "hack;drop" }).sort).toBe("newest");
  });
  it("max price filters offers whose lowest price exceeds it", () => {
    const where: string[] = [];
    const values: unknown[] = [];
    applyBrowseFilters(normalizeFilters({ maxPrice: 500 }), where, values);
    expect(values).toContain(500);
    expect(where.some((w) => w.includes("<= $"))).toBe(true);
  });
  it("price sorts ignore absurd prices below 10 or above 5,000,000", () => {
    expect(sortSql("price_asc")).toContain("BETWEEN 10 AND 5000000");
  });
  it("payment filter only keeps known methods", () => {
    expect(normalizeFilters({ payments: ["paypal", "gold"] }).payments).toEqual(["paypal"]);
  });
  it("verified and images toggles add conditions", () => {
    const where: string[] = [];
    applyBrowseFilters(normalizeFilters({ verifiedOnly: true, withImages: true }), where, []);
    expect(where).toHaveLength(2);
  });
});
