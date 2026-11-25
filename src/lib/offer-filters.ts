/** Shared, client-safe browse filter definitions plus a pure SQL builder (used server-side). */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Best rated" },
  { value: "verified", label: "Verified first" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const CURRENCIES = [
  { value: "robux", label: "Robux" },
  { value: "usd", label: "USD" },
  { value: "eur", label: "EUR" },
] as const;

export const PAYMENT_FILTERS = [
  { value: "robux", label: "Robux" },
  { value: "paypal", label: "PayPal" },
  { value: "usd", label: "USD" },
  { value: "crypto", label: "Crypto" },
] as const;

export const EXAMPLE_QUERIES = [
  "cheap scripter for simulator game",
  "UI designer with 3 years experience",
  "builder for a tycoon map",
  "GFX thumbnail under 500 Robux",
];

export type BrowseFilters = {
  sort: string;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  payments: string[];
  verifiedOnly: boolean;
  withImages: boolean;
};

const CURRENCY_PATTERNS: Record<string, string[]> = {
  robux: ["%r$%", "%robux%", "%rbx%"],
  usd: ["%$%", "%usd%", "%dollar%"],
  eur: ["%€%", "%eur%"],
};
const PAYMENT_PATTERNS: Record<string, string[]> = {
  robux: ["%robux%", "%r$%", "%rbx%"],
  paypal: ["%paypal%"],
  usd: ["%usd%", "%$%", "%dollar%"],
  crypto: ["%crypto%", "%btc%", "%bitcoin%", "%eth%", "%ltc%", "%usdt%"],
};

/** Sane price bounds, matching formatPrice so sort/filter agree with what cards show. */
const SANE_LO = "(CASE WHEN coalesce(nullif(o.price_min,0), o.price_max) BETWEEN 10 AND 5000000 THEN coalesce(nullif(o.price_min,0), o.price_max) END)";
const SANE_HI = "(CASE WHEN coalesce(nullif(o.price_max,0), o.price_min) BETWEEN 10 AND 5000000 THEN coalesce(nullif(o.price_max,0), o.price_min) END)";

export function sortSql(sort: string): string {
  const tail = "o.timestamp DESC NULLS LAST";
  switch (sort) {
    case "oldest":
      return "o.timestamp ASC NULLS LAST";
    case "price_asc":
      return `${SANE_LO} ASC NULLS LAST, ${tail}`;
    case "price_desc":
      return `${SANE_HI} DESC NULLS LAST, ${tail}`;
    case "rating":
      return `r.avg_score DESC NULLS LAST, r.review_count DESC NULLS LAST, ${tail}`;
    case "verified":
      return `(v.user_id IS NOT NULL) DESC, ${tail}`;
    default:
      return `o.is_pinned DESC NULLS LAST, ${tail}`;
  }
}

/** Appends WHERE fragments for browse filters; mutates `where`/`values`. */
export function applyBrowseFilters(f: BrowseFilters, where: string[], values: unknown[]) {
  const any = (patterns: string[], column: string) => {
    values.push(patterns);
    where.push(`coalesce(${column},'') ILIKE ANY($${values.length}::text[])`);
  };
  const hasPrice = f.minPrice !== null || f.maxPrice !== null;
  if (hasPrice) {
    where.push(`${SANE_LO} IS NOT NULL AND ${SANE_HI} IS NOT NULL`);
    const patterns = CURRENCY_PATTERNS[f.currency];
    if (patterns) any(patterns, "o.price_display");
  }
  if (f.minPrice !== null) {
    values.push(f.minPrice);
    where.push(`${SANE_HI} >= $${values.length}`);
  }
  if (f.maxPrice !== null) {
    values.push(f.maxPrice);
    where.push(`${SANE_LO} <= $${values.length}`);
  }
  const pay = f.payments.flatMap((p) => PAYMENT_PATTERNS[p] ?? []);
  if (pay.length > 0) any(pay, "o.payment_method");
  if (f.verifiedOnly) where.push("v.user_id IS NOT NULL");
  if (f.withImages) where.push("coalesce(o.image_url,'') ILIKE 'http%'");
}

export function normalizeFilters(input: Partial<Record<keyof BrowseFilters, unknown>> | undefined): BrowseFilters {
  const num = (v: unknown) => {
    const n = Number(v);
    return v === null || v === undefined || v === "" || !Number.isFinite(n) || n < 0 ? null : Math.floor(n);
  };
  const sort = SORT_OPTIONS.some((s) => s.value === input?.sort) ? String(input?.sort) : "newest";
  const currency = CURRENCIES.some((c) => c.value === input?.currency) ? String(input?.currency) : "robux";
  const payments = Array.isArray(input?.payments)
    ? input.payments.filter((p): p is string => PAYMENT_FILTERS.some((x) => x.value === p))
    : [];
  return {
    sort,
    minPrice: num(input?.minPrice),
    maxPrice: num(input?.maxPrice),
    currency,
    payments,
    verifiedOnly: input?.verifiedOnly === true,
    withImages: input?.withImages === true,
  };
}
