import { describe, expect, it } from "vitest";
import { adHref, adStatus, matchesAdCategory, normalizeAdCategory, safeHttpUrl } from "./ads";

describe("matchesAdCategory", () => {
  it("runs untargeted ads everywhere, including broad browses", () => {
    expect(matchesAdCategory({ categories: [] }, "Scripting")).toBe(true);
    expect(matchesAdCategory({ categories: [] }, "all")).toBe(true);
    expect(matchesAdCategory({ categories: [] }, null)).toBe(true);
  });

  it("runs a targeted ad only on a matching category", () => {
    const ad = { categories: ["Scripting", "UI/GUI Design"] };
    expect(matchesAdCategory(ad, "Scripting")).toBe(true);
    expect(matchesAdCategory(ad, "UI/GUI Design")).toBe(true);
    expect(matchesAdCategory(ad, "Building")).toBe(false);
  });

  it("keeps targeted ads out of broad browses, like the bot does", () => {
    const ad = { categories: ["Scripting"] };
    expect(matchesAdCategory(ad, "all")).toBe(false);
    expect(matchesAdCategory(ad, "")).toBe(false);
    expect(matchesAdCategory(ad, null)).toBe(false);
  });

  it("normalizes case and spacing before comparing", () => {
    expect(normalizeAdCategory("  UI / GUI ")).toBe("ui/gui");
    expect(matchesAdCategory({ categories: ["  graphics/gfx "] }, "Graphics/GFX")).toBe(true);
  });
});

describe("adStatus", () => {
  const now = Date.parse("2026-01-10T12:00:00Z");
  const base = { active: true, expiresAt: null, maxClicks: 0 };

  it("is active while unexpired and under budget", () => {
    expect(adStatus(base, 0, now)).toBe("active");
    expect(adStatus({ ...base, maxClicks: 100 }, 99, now)).toBe("active");
  });

  it("pauses, expires and stops at the click budget", () => {
    expect(adStatus({ ...base, active: false }, 0, now)).toBe("paused");
    expect(adStatus({ ...base, expiresAt: "2026-01-09T12:00:00Z" }, 0, now)).toBe("expired");
    expect(adStatus({ ...base, maxClicks: 100 }, 100, now)).toBe("budget");
  });
});

describe("safeHttpUrl", () => {
  it("accepts http and https only", () => {
    expect(safeHttpUrl("https://example.com/ad")).toBe("https://example.com/ad");
    expect(safeHttpUrl("http://example.com")).toBe("http://example.com/");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,<script>")).toBeNull();
    expect(safeHttpUrl("   ")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe("adHref", () => {
  it("always points at the tracked redirect", () => {
    expect(adHref(7)).toBe("/go/7");
    expect(adHref("12")).toBe("/go/12");
  });
});
