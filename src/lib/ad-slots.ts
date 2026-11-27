/** Ad slot packages sold on /advertise. Prices are launch prices in euro. */
export type AdSlotId = "starter" | "targeted" | "launch" | "post";

export type AdSlot = {
  id: AdSlotId;
  name: string;
  emoji: string;
  priceEur: number;
  blurb: string;
  features: string[];
};

export const AD_SLOTS: AdSlot[] = [
  {
    id: "starter",
    name: "Starter",
    emoji: "🟢",
    priceEur: 3,
    blurb: "Your ad under the search results, on every search.",
    features: ["Shown on all searches", "7 days", "Image creative"],
  },
  {
    id: "targeted",
    name: "Targeted",
    emoji: "🟡",
    priceEur: 8,
    blurb: "Only shown on searches in the category you pick.",
    features: ["Category targeting (e.g. Scripting)", "14 days", "Image or GIF"],
  },
  {
    id: "launch",
    name: "Launch",
    emoji: "🔴",
    priceEur: 20,
    blurb: "The full package: targeted placement, server post and a report.",
    features: [
      "Targeted placement",
      "GIF or video creative",
      "Announcement post in the server",
      "Views & clicks report",
      "30 days",
    ],
  },
  {
    id: "post",
    name: "Server Post",
    emoji: "📌",
    priceEur: 3,
    blurb: "A pinned announcement in the Discord server.",
    features: ["Pinned in the server", "7 days"],
  },
];

/** Typed lookup so callers never index the array directly. */
export function adSlotById(id: AdSlotId): AdSlot {
  const slot = AD_SLOTS.find((candidate) => candidate.id === id);
  if (!slot) throw new Error(`Unknown ad slot: ${id}`);
  return slot;
}

/** The first three advertisers pay half; shown next to the list price. */
const DISCOUNT_SHARE = 0.5;

export function discountedEur(priceEur: number): number {
  return Math.round(priceEur * DISCOUNT_SHARE * 100) / 100;
}

export function euro(value: number): string {
  return `€${value % 1 === 0 ? value : value.toFixed(2)}`;
}
