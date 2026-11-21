/** Pure, client-safe display helpers for offers (prices, titles, dates). */

export type PriceFields = {
  price_display: string | null;
  price_min: number | null;
  price_max: number | null;
};

export const PRICE_ON_REQUEST = "Price on request";
const MAX_SANE = 5_000_000;
const MIN_ROBUX = 10;

function currencyOf(text: string): "ROBUX" | "USD" | "EUR" | "GBP" | null {
  const t = text.toLowerCase();
  if (/robux|r\$|\brbx\b/.test(t)) return "ROBUX";
  if (/€|\beur/.test(t)) return "EUR";
  if (/£|\bgbp/.test(t)) return "GBP";
  if (/\$|usd|dollar/.test(t)) return "USD";
  return null;
}

/** Numbers in a price string; "200,500,500" → 200500500, "1.5k" → 1500. */
function amountsOf(text: string): number[] {
  return [...text.toLowerCase().matchAll(/(\d{1,3}(?:[,.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|m)?\b/g)]
    .map((m) => {
      const raw = m[1]!;
      const grouped = /^\d{1,3}(?:[,.\s]\d{3})+$/.test(raw);
      const n = grouped ? Number(raw.replace(/[,.\s]/g, "")) : Number(raw.replace(",", "."));
      return n * (m[2] === "k" ? 1_000 : m[2] === "m" ? 1_000_000 : 1);
    })
    .filter((n) => Number.isFinite(n) && n > 0);
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** One shared price formatter with sanity checks against absurd values. */
export function formatPrice(row: PriceFields): string {
  const display = (row.price_display ?? "").trim();
  if (display) {
    const amounts = amountsOf(display);
    const currency = currencyOf(display);
    if (amounts.length) {
      if (Math.max(...amounts) > MAX_SANE) return PRICE_ON_REQUEST;
      if ((currency === "ROBUX" || currency === null) && Math.min(...amounts) < MIN_ROBUX)
        return PRICE_ON_REQUEST;
    }
    return display.length > 44 ? `${display.slice(0, 41)}…` : display;
  }
  const min = row.price_min ?? 0;
  const max = row.price_max ?? 0;
  if (min <= 0 && max <= 0) return PRICE_ON_REQUEST;
  const lo = min > 0 ? min : max;
  const hi = Math.max(min, max);
  if (lo < MIN_ROBUX || hi > MAX_SANE) return PRICE_ON_REQUEST;
  return lo === hi ? `R$ ${fmt(lo)}` : `R$ ${fmt(lo)}–${fmt(hi)}`;
}

const TAG_RE =
  /^\s*[[(]?\s*(hiring|for hire|forhire|selling|buying|investment|looking for work|lf|lfw|lfh|commissions? open)\s*[\])]?\s*[:\-–|]?\s*/i;

/** Clean a raw Discord first line into a readable card title (≤70 chars). */
export function cleanTitle(raw: string, max = 70): string {
  let t = raw
    .replace(/<a?:\w+:\d+>/g, " ")
    .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, " ")
    .replace(/[\u2500-\u259F\u25A0-\u25FF\u2800-\u28FF]/g, " ")
    .replace(/[*_~`>#|•·]+/g, " ")
    .replace(/\[(?:[^\]]{0,20})\]/g, (m) => (TAG_RE.test(m) ? " " : m))
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 0; i < 3 && TAG_RE.test(t); i++) t = t.replace(TAG_RE, "");
  t = t.replace(/^[\s:\-–|,.!]+|[\s:\-–|,]+$/g, "").trim();
  if (t.length > max) t = `${t.slice(0, max - 1).trimEnd()}…`;
  return t;
}

export const EXPIRY_DAYS = 30;

export function isExpired(postedAt: string | null, now = Date.now()): boolean {
  if (!postedAt) return false;
  return now - Date.parse(postedAt) > EXPIRY_DAYS * 86_400_000;
}

export function relativeTime(postedAt: string | null, now = Date.now()): string {
  if (!postedAt) return "";
  const s = Math.max(0, Math.round((now - Date.parse(postedAt)) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
