/**
 * Client-safe helpers for saved searches: whitelist + normalisation of the
 * browse parameters, a human label and the URL round-trip back to the
 * marketplace. Used by the server (validation) and the browser (form state).
 */
import { CURRENCIES, PAYMENT_FILTERS, SORT_OPTIONS } from "@/lib/offer-filters";
import { POST_TYPES } from "@/lib/market-data";

export type SavedSearchParams = {
  cat: string;
  type: string;
  q: string;
  sort: string;
  min: number | null;
  max: number | null;
  cur: string;
  pay: string[];
  verified: boolean;
  images: boolean;
};

export const DEFAULT_SAVED_SEARCH_PARAMS: SavedSearchParams = {
  cat: "all",
  type: "all",
  q: "",
  sort: "newest",
  min: null,
  max: null,
  cur: "robux",
  pay: [],
  verified: false,
  images: false,
};

const MAX_PRICE = 5_000_000;
const MAX_QUERY = 80;
const MAX_CATEGORY = 60;
const MAX_LABEL = 80;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function price(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(Math.floor(n), MAX_PRICE);
}

/** Keeps only known filters and sane values — everything else is dropped. */
export function sanitizeSavedSearchParams(input: unknown): SavedSearchParams {
  const raw = (input ?? {}) as Record<string, unknown>;
  const sort = SORT_OPTIONS.some((option) => option.value === raw["sort"])
    ? String(raw["sort"])
    : "newest";
  const cur = CURRENCIES.some((option) => option.value === raw["cur"])
    ? String(raw["cur"])
    : "robux";
  const pay = Array.isArray(raw["pay"])
    ? raw["pay"].filter(
        (value): value is string =>
          typeof value === "string" && PAYMENT_FILTERS.some((option) => option.value === value),
      )
    : [];

  return {
    cat: text(raw["cat"], MAX_CATEGORY) || "all",
    type: text(raw["type"], 30) || "all",
    q: text(raw["q"], MAX_QUERY),
    sort,
    min: price(raw["min"]),
    max: price(raw["max"]),
    cur,
    pay: [...new Set(pay)],
    verified: raw["verified"] === true,
    images: raw["images"] === true,
  };
}

export function isDefaultSavedSearch(params: SavedSearchParams): boolean {
  return JSON.stringify(params) === JSON.stringify(DEFAULT_SAVED_SEARCH_PARAMS);
}

const maxFontPrice = (value: number) => value.toLocaleString("en-US");

/** Auto label such as `Scripting · ≤ 5,000 Robux · “tycoon”`, capped at 80 chars. */
export function buildSavedSearchLabel(params: SavedSearchParams): string {
  const parts: string[] = [];
  if (params.cat !== "all") parts.push(params.cat);
  if (params.type !== "all")
    parts.push(POST_TYPES.find((type) => type.value === params.type)?.label ?? params.type);
  if (params.q) parts.push(`“${params.q}”`);

  if (params.min !== null || params.max !== null) {
    const currency = CURRENCIES.find((option) => option.value === params.cur)?.label ?? params.cur;
    if (params.min !== null && params.max !== null)
      parts.push(`${maxFontPrice(params.min)}–${maxFontPrice(params.max)} ${currency}`);
    else if (params.min !== null) parts.push(`≥ ${maxFontPrice(params.min)} ${currency}`);
    else if (params.max !== null) parts.push(`≤ ${maxFontPrice(params.max as number)} ${currency}`);
  }

  for (const pay of params.pay)
    parts.push(PAYMENT_FILTERS.find((option) => option.value === pay)?.label ?? pay);
  if (params.verified) parts.push("Verified only");
  if (params.images) parts.push("With images");

  const label = parts.join(" · ").trim();
  return (label || "All offers").slice(0, MAX_LABEL);
}

/** Deep link back to the marketplace with this search applied. */
export function savedSearchHref(params: SavedSearchParams): string {
  const search = new URLSearchParams({
    cat: params.cat,
    type: params.type,
    q: params.q,
    page: "1",
    sort: params.sort,
    cur: params.cur,
    pay: JSON.stringify(params.pay),
    verified: String(params.verified),
    images: String(params.images),
  });
  if (params.min !== null) search.set("min", String(params.min));
  if (params.max !== null) search.set("max", String(params.max));
  return `/?${search.toString()}`;
}

/** Offer ids are stored as text but the offers table uses positive integers. */
export function parseOfferId(value: unknown): string | null {
  const id =
    typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
  return /^\d{1,24}$/.test(id) ? id : null;
}
