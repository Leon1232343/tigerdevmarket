import {
  applyBrowseFilters,
  normalizeFilters,
  sortSql,
  type BrowseFilters,
} from "@/lib/offer-filters";
/**
 * Server-only access to the external Tiger Market offers database (Neon Postgres).
 * Never import this from client code.
 */
import { Client } from "pg";
import type { Offer, OfferSource, PostType } from "@/lib/market-data";
import type { MatchableOffer } from "@/lib/saved-search-match";
import { formatPrice, cleanTitle } from "@/lib/offer-format";
import { dbClientConfig } from "@/lib/offers-db-config";

/**
 * Serverless runtimes cannot keep TCP sockets alive between requests, so a
 * module-level pool hangs on reuse. Open a short-lived client per query instead.
 */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const connectionString = process.env["TIGER_MARKET_DB_URL"];
  if (!connectionString) throw new Error("TIGER_MARKET_DB_URL is not configured");
  // TLS is on and the server certificate is verified; see offers-db-config.ts.
  const client = new Client(dbClientConfig(connectionString));
  await client.connect();
  try {
    const result = await client.query(sql, params as never[]);
    return result.rows as T[];
  } finally {
    await client.end().catch(() => {});
  }
}

/** Canonical categories shown in the bento grid, matched against the CSV `category` column. */
export const CANONICAL_CATEGORIES = [
  { slug: "scripting", name: "Scripting", icon: "⌘", match: "Scripting" },
  { slug: "building", name: "Building", icon: "▦", match: "Building" },
  { slug: "ui-design", name: "UI/GUI Design", icon: "◲", match: "UI/GUI Design" },
  { slug: "modeling", name: "3D Modeling", icon: "◈", match: "3D Modeling" },
  { slug: "gfx", name: "Graphics/GFX", icon: "◐", match: "Graphics/GFX" },
  { slug: "animation", name: "Animation", icon: "➤", match: "Animation" },
  { slug: "vfx", name: "VFX", icon: "◆", match: "VFX" },
  { slug: "audio", name: "Sound/Music", icon: "♪", match: "Sound/Music" },
] as const;

export type OfferRow = {
  offer_id: number;
  seller_username: string | null;
  seller_id: string | null;
  service_type: string | null;
  category: string | null;
  post_type: string | null;
  price_display: string | null;
  price_min: number | null;
  price_max: number | null;
  payment_method: string | null;
  message_content: string | null;
  description: string | null;
  jump_link: string | null;
  image_url: string | null;
  rating_score: number | null;
  is_pinned: number | null;
  source: string | null;
  server_name: string | null;
  timestamp: Date | string | null;
  verified?: boolean | null;
  review_count?: number | null;
  avg_score?: number | null;
};

export type OfferDTO = Offer;

export const POST_TYPE_MAP: Record<string, PostType> = {
  "for hire": "forhire",
  hiring: "hiring",
  "hiring agent": "hiring",
  selling: "selling",
  buying: "buying",
  "seeking investment": "investment",
  "offering investment": "investment",
};

export function toPostType(value: string | null): PostType {
  return POST_TYPE_MAP[(value ?? "").trim().toLowerCase()] ?? "selling";
}

/** Strip Discord markdown noise so titles/excerpts read cleanly. */
function clean(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<a?:\w+:\d+>/g, "")
    .replace(/[*_~`>#|]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function paragraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => clean(line))
        .filter(Boolean)
        .join(" "),
    )
    .filter((block) => block.length > 0)
    .slice(0, 12);
}

function buildTitle(row: OfferRow): string {
  const lines = (row.message_content ?? "")
    .split("\n")
    .map((line) => cleanTitle(clean(line)))
    .filter((line) => line.length > 3);
  const first = lines.find((line) => line.length >= 8) ?? lines[0];
  if (first) return first;
  const service = row.service_type && row.service_type !== "General" ? row.service_type : "Roblox";
  return `${row.post_type ?? "Offer"} — ${service}`;
}

/** Default-list quality filter: hides near-empty, junk "Other" and expired (>30d) offers. */
export const QUALITY_WHERE = [
  "o.message_content IS NOT NULL",
  "length(trim(o.message_content)) >= 25",
  `NOT (coalesce(o.category,'') ILIKE 'other' AND coalesce(trim(o.price_display),'') = '' AND coalesce(o.price_min,0) = 0 AND coalesce(o.price_max,0) = 0)`,
  "(o.timestamp IS NULL OR o.timestamp > now() - interval '30 days')",
];

function splitList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function scamWarning(row: OfferRow, verified: boolean): string | undefined {
  const postType = toPostType(row.post_type);
  if (postType === "investment")
    return "Investment offers carry no platform guarantee. Tiger Market does not escrow funds — verify all terms independently before sending anything.";
  if (!verified)
    return "This seller is not verified on Tiger Market. Never pay in full up front, use a trusted middleman, and keep all agreements in writing.";
  return undefined;
}

export function mapOffer(row: OfferRow): OfferDTO {
  const verified = Boolean(row.verified);
  const content = row.message_content ?? "";
  const body = paragraphs(row.description?.trim() ? row.description : content);
  const title = buildTitle(row);
  const excerptSource = body.find((block) => clean(block) !== title) ?? body[0] ?? title;
  const excerpt =
    excerptSource.length > 180 ? `${excerptSource.slice(0, 177).trimEnd()}…` : excerptSource;
  const categories = splitList(row.category);
  // Some rows store several URLs comma-separated; use the first usable one.
  const imageUrl =
    (row.image_url ?? "")
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.startsWith("http")) ?? null;

  return {
    publicId: String(row.offer_id),
    title,
    excerpt,
    description: body.length > 0 ? body : [title],
    category: categories[0] ?? row.service_type ?? "Other",
    categories,
    postType: toPostType(row.post_type),
    source: (row.source ?? "discord") === "website" ? "website" : "discord",
    seller: row.seller_username ?? "unknown",
    sellerId: row.seller_id && /^[\w-]{1,40}$/.test(row.seller_id) ? row.seller_id : null,
    verified,
    price: formatPrice(row),
    paymentMethods: splitList(row.payment_method).filter(
      (method) => method.toLowerCase() !== "unknown",
    ),
    rating: Number(row.avg_score ?? row.rating_score ?? 0) || 0,
    reviews: Number(row.review_count ?? 0) || 0,
    thumbnail: Boolean(imageUrl),
    imageUrl,
    serverName: row.server_name ?? null,
    postedAt: row.timestamp ? new Date(row.timestamp).toISOString() : null,
    scamWarning: scamWarning(row, verified),
    originalUrl: row.jump_link ?? "#original-post",
  };
}

export const SELECT_COLUMNS = `
  o.offer_id, o.seller_username, o.seller_id, o.service_type, o.category, o.post_type,
  o.price_display, o.price_min, o.price_max, o.payment_method, o.message_content,
  o.description, o.jump_link, o.image_url, o.rating_score, o.is_pinned, o.source,
  o.server_name, o.timestamp,
  (v.user_id IS NOT NULL) AS verified,
  COALESCE(r.review_count, 0) AS review_count,
  r.avg_score
`;

export const JOINS = `
  LEFT JOIN verified_users v ON v.user_id = o.seller_id
  LEFT JOIN (
    SELECT offer_id, COUNT(*)::int AS review_count, AVG(score)::real AS avg_score
    FROM ratings GROUP BY offer_id
  ) r ON r.offer_id = o.offer_id
`;

export type ListParams = {
  category?: string;
  postType?: string;
  search?: string;
  page?: number;
  perPage?: number;
} & Partial<BrowseFilters>;

export async function listOffers(params: ListParams) {
  const perPage = Math.min(Math.max(params.perPage ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const where: string[] = [...QUALITY_WHERE];
  const values: unknown[] = [];

  if (params.category && params.category !== "all") {
    values.push(`%${params.category}%`);
    where.push(`o.category ILIKE $${values.length}`);
  }
  if (params.postType && params.postType !== "all") {
    const labels = Object.entries(POST_TYPE_MAP)
      .filter(([, value]) => value === params.postType)
      .map(([label]) => label);
    if (labels.length > 0) {
      values.push(labels);
      where.push(`lower(trim(o.post_type)) = ANY($${values.length}::text[])`);
    }
  }
  const search = (params.search ?? "").trim();
  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    where.push(
      `(o.message_content ILIKE $${idx} OR o.seller_username ILIKE $${idx} OR o.category ILIKE $${idx} OR o.service_type ILIKE $${idx} OR o.price_display ILIKE $${idx})`,
    );
  }

  const filters = normalizeFilters(params);
  applyBrowseFilters(filters, where, values);

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const countRows = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM offers o ${JOINS} ${whereSql}`,
    values,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS} ${whereSql}
     ORDER BY ${sortSql(filters.sort)}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, perPage, (page - 1) * perPage],
  );

  return {
    offers: rows.map(mapOffer),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getOfferById(publicId: string): Promise<OfferDTO | null> {
  const id = Number(publicId);
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS} WHERE o.offer_id = $1 LIMIT 1`,
    [id],
  );
  const row = rows[0];
  return row ? mapOffer(row) : null;
}

export async function getMarketOverview() {
  const [stats] = await query<{
    total: string;
    today: string;
    sellers: string;
    avg_rating: number | null;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE o.timestamp > now() - interval '24 hours')::text AS today,
       COUNT(DISTINCT o.seller_id)::text AS sellers,
       (SELECT AVG(score)::real FROM ratings) AS avg_rating
     FROM offers o`,
  );

  const counts = await query<{ name: string; total: string }>(
    `SELECT c.name, COUNT(o.offer_id)::text AS total
       FROM (SELECT unnest($1::text[]) AS name) c
       LEFT JOIN offers o ON o.category ILIKE '%' || c.name || '%'
      GROUP BY c.name`,
    [CANONICAL_CATEGORIES.map((cat) => cat.match)],
  );
  const byName = new Map(counts.map((row) => [row.name, Number(row.total)]));

  return {
    stats: {
      totalOffers: Number(stats?.total ?? 0),
      offersToday: Number(stats?.today ?? 0),
      sellers: Number(stats?.sellers ?? 0),
      avgRating: Number(stats?.avg_rating ?? 0) || 0,
    },
    categories: CANONICAL_CATEGORIES.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      listings: byName.get(cat.match) ?? 0,
    })),
  };
}

export async function getAllOfferIds(): Promise<{ offerId: string; postedAt: string | null }[]> {
  const rows = await query<{ offer_id: number; timestamp: Date | string | null }>(
    `SELECT offer_id, timestamp FROM offers
      WHERE message_content IS NOT NULL AND length(message_content) > 20
      ORDER BY timestamp DESC NULLS LAST`,
  );
  return rows.map((row) => ({
    offerId: String(row.offer_id),
    postedAt: row.timestamp ? new Date(row.timestamp).toISOString() : null,
  }));
}

/** Offers for a set of ids (favorites), keeping the order the caller passed in. */
export async function listOffersByIds(ids: string[]): Promise<OfferDTO[]> {
  const numeric = [
    ...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)),
  ].slice(0, 200);
  if (numeric.length === 0) return [];

  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS} WHERE o.offer_id = ANY($1::int[])`,
    [numeric],
  );
  const byId = new Map(rows.map((row) => [String(row.offer_id), mapOffer(row)]));
  return ids
    .map((id) => byId.get(String(Number(id))))
    .filter((offer): offer is OfferDTO => Boolean(offer));
}

/** Every offer of one seller, newest first — used by the member dashboard. */
export async function listOffersBySeller(sellerId: string, limit = 100): Promise<OfferDTO[]> {
  if (!/^[\w-]{1,40}$/.test(sellerId)) return [];
  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS}
      WHERE o.seller_id = $1
      ORDER BY o.timestamp DESC NULLS LAST
      LIMIT $2`,
    [sellerId, Math.min(Math.max(limit, 1), 200)],
  );
  return rows.map(mapOffer);
}

export type MatchableOfferRow = MatchableOffer & { postedAt: string | null };

/**
 * Offers newer than a timestamp, shaped for the saved-search matcher. One query
 * feeds every saved search, so the dashboard stays at a single Neon round trip.
 */
export async function listOffersForMatching(sinceIso: string): Promise<MatchableOfferRow[]> {
  const rows = await query<{
    offer_id: number;
    category: string | null;
    service_type: string | null;
    post_type: string | null;
    message_content: string | null;
    seller_username: string | null;
    price_display: string | null;
    price_min: number | null;
    price_max: number | null;
    payment_method: string | null;
    image_url: string | null;
    timestamp: Date | string | null;
    verified: boolean | null;
  }>(
    `SELECT o.offer_id, o.category, o.service_type, o.post_type, o.message_content,
            o.seller_username, o.price_display, o.price_min, o.price_max, o.payment_method,
            o.image_url, o.timestamp, (v.user_id IS NOT NULL) AS verified
       FROM offers o LEFT JOIN verified_users v ON v.user_id = o.seller_id
      WHERE o.timestamp > $1::timestamptz
        AND o.timestamp > now() - interval '30 days'
        AND o.message_content IS NOT NULL
      ORDER BY o.timestamp DESC NULLS LAST
      LIMIT 500`,
    [sinceIso],
  );

  return rows.map((row) => ({
    publicId: String(row.offer_id),
    category: row.category,
    serviceType: row.service_type,
    postType: toPostType(row.post_type),
    body: clean(row.message_content ?? "").slice(0, 4000),
    seller: row.seller_username,
    priceText: row.price_display,
    priceMin: row.price_min,
    priceMax: row.price_max,
    paymentMethod: row.payment_method,
    imageUrl: row.image_url,
    verified: Boolean(row.verified),
    postedAt: row.timestamp ? new Date(row.timestamp).toISOString() : null,
  }));
}

/** Public seller profile: identity, stats and their active offers (quality-filtered). */
export async function getSellerProfile(sellerId: string) {
  if (!/^[\w-]{1,40}$/.test(sellerId)) return null;
  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS}
      WHERE o.seller_id = $1 AND ${QUALITY_WHERE.join(" AND ")}
      ORDER BY o.timestamp DESC NULLS LAST LIMIT 48`,
    [sellerId],
  );
  const [stats] = await query<{
    total: string;
    first: Date | string | null;
    name: string | null;
    verified: boolean;
    reviews: string;
    avg: number | null;
  }>(
    `SELECT COUNT(*)::text AS total, MIN(o.timestamp) AS first,
            (array_agg(o.seller_username ORDER BY o.timestamp DESC NULLS LAST))[1] AS name,
            bool_or(v.user_id IS NOT NULL) AS verified,
            (SELECT COUNT(*)::text FROM ratings ra JOIN offers x ON x.offer_id = ra.offer_id WHERE x.seller_id = $1) AS reviews,
            (SELECT AVG(ra.score)::real FROM ratings ra JOIN offers x ON x.offer_id = ra.offer_id WHERE x.seller_id = $1) AS avg
       FROM offers o LEFT JOIN verified_users v ON v.user_id = o.seller_id
      WHERE o.seller_id = $1`,
    [sellerId],
  );
  if (!stats || Number(stats.total) === 0) return null;
  const offers = rows.map(mapOffer);
  const categories = [...new Set(offers.flatMap((o) => o.categories))].slice(0, 8);
  return {
    sellerId,
    name: stats.name ?? "unknown",
    verified: Boolean(stats.verified),
    totalOffers: Number(stats.total),
    activeOffers: offers.length,
    memberSince: stats.first ? new Date(stats.first).toISOString() : null,
    reviews: Number(stats.reviews ?? 0),
    rating: Number(stats.avg ?? 0) || 0,
    categories,
    offers,
  };
}
