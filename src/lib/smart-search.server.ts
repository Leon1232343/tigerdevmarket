/**
 * AI smart search over the external offers database.
 * Combines an embedding index (pgvector, table `offer_embeddings`) for semantic
 * recall with AI query understanding that extracts hard filters.
 * Server-only — never import from client code.
 */
import { query, mapOffer, SELECT_COLUMNS, JOINS, POST_TYPE_MAP } from "@/lib/offers.server";
import type { OfferRow } from "@/lib/offers.server";
import type { Offer, PostType } from "@/lib/market-data";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
export const EMBEDDING_MODEL = "google/gemini-embedding-2";
const CHAT_MODEL = "openai/gpt-5.6-sol";
const EMBEDDING_DIMS = 3072;

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

export type Interpretation = {
  semanticQuery: string;
  keywords: string[];
  category: string | null;
  postType: PostType | null;
  verifiedOnly: boolean;
  maxPrice: number | null;
  minPrice: number | null;
};

const CATEGORIES = [
  "Scripting",
  "Building",
  "UI/GUI Design",
  "3D Modeling",
  "Graphics/GFX",
  "Animation",
  "VFX",
  "Sound/Music",
];

const EMPTY_INTERPRETATION: Interpretation = {
  semanticQuery: "",
  keywords: [],
  category: null,
  postType: null,
  verifiedOnly: false,
  maxPrice: null,
  minPrice: null,
};

/** Ask the model to turn free-form text into structured marketplace filters. */
export async function interpretQuery(raw: string): Promise<Interpretation> {
  const text = raw.trim().slice(0, 300);
  if (!text) return EMPTY_INTERPRETATION;

  const system = `You turn a Roblox developer marketplace search query into JSON filters.
Allowed "category" values: ${CATEGORIES.join(", ")} or null.
Allowed "postType" values: hiring, forhire, buying, selling, investment, or null.
Return ONLY JSON with keys: semanticQuery (string, cleaned English description of what the user wants),
keywords (array of up to 5 short lowercase terms), category, postType,
verifiedOnly (boolean), minPrice (number in Robux or null), maxPrice (number in Robux or null).
The query may be in any language; semanticQuery must be English.`;

  try {
    const response = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        reasoning_effort: "none",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });
    if (!response.ok) {
      console.error(`Smart search interpret failed [${response.status}]: ${await response.text()}`);
      return { ...EMPTY_INTERPRETATION, semanticQuery: text };
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}") as
      Partial<Interpretation>;

    const category =
      typeof parsed.category === "string"
        ? (CATEGORIES.find((c) => c.toLowerCase() === parsed.category!.toLowerCase()) ?? null)
        : null;
    const postTypes = new Set(Object.values(POST_TYPE_MAP));
    const postType =
      typeof parsed.postType === "string" && postTypes.has(parsed.postType as PostType)
        ? (parsed.postType as PostType)
        : null;

    return {
      semanticQuery:
        typeof parsed.semanticQuery === "string" && parsed.semanticQuery.trim()
          ? parsed.semanticQuery.trim().slice(0, 300)
          : text,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords
            .filter((k): k is string => typeof k === "string")
            .map((k) => k.trim().toLowerCase().slice(0, 32))
            .filter(Boolean)
            .slice(0, 5)
        : [],
      category,
      postType,
      verifiedOnly: parsed.verifiedOnly === true,
      minPrice: Number.isFinite(parsed.minPrice) ? Number(parsed.minPrice) : null,
      maxPrice: Number.isFinite(parsed.maxPrice) ? Number(parsed.maxPrice) : null,
    };
  } catch (error) {
    console.error("Smart search interpret error", error);
    return { ...EMPTY_INTERPRETATION, semanticQuery: text };
  }
}

/** Embed one or more strings (max 100 per request for Gemini embeddings). */
export async function embedTexts(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const response = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  });
  if (!response.ok) {
    throw new Error(`Embedding request failed [${response.status}]: ${await response.text()}`);
  }
  const payload = (await response.json()) as {
    data?: { index: number; embedding: number[] }[];
  };
  const rows = (payload.data ?? []).slice().sort((a, b) => a.index - b.index);
  return rows.map((row) => row.embedding);
}

function toVectorLiteral(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Unexpected embedding size ${embedding.length}`);
  }
  return `[${embedding.join(",")}]`;
}

export type SmartSearchResult = {
  offers: Offer[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  interpretation: Interpretation;
  mode: "semantic" | "keyword";
};

export async function smartSearchOffers(params: {
  search: string;
  page?: number;
  perPage?: number;
}): Promise<SmartSearchResult> {
  const perPage = Math.min(Math.max(params.perPage ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const interpretation = await interpretQuery(params.search);

  let embedding: number[] | null = null;
  try {
    const [vector] = await embedTexts([interpretation.semanticQuery || params.search]);
    embedding = vector ?? null;
  } catch (error) {
    console.error("Smart search embedding error", error);
  }

  const where: string[] = ["o.message_content IS NOT NULL", "length(o.message_content) > 20"];
  const values: unknown[] = [];

  if (interpretation.category) {
    values.push(`%${interpretation.category}%`);
    where.push(`o.category ILIKE $${values.length}`);
  }
  if (interpretation.postType) {
    const labels = Object.entries(POST_TYPE_MAP)
      .filter(([, value]) => value === interpretation.postType)
      .map(([label]) => label);
    values.push(labels);
    where.push(`lower(trim(o.post_type)) = ANY($${values.length}::text[])`);
  }
  if (interpretation.maxPrice !== null) {
    values.push(interpretation.maxPrice);
    where.push(`(o.price_min IS NULL OR o.price_min <= $${values.length})`);
  }
  if (interpretation.minPrice !== null) {
    values.push(interpretation.minPrice);
    where.push(`(o.price_max IS NULL OR o.price_max >= $${values.length})`);
  }
  if (interpretation.verifiedOnly) {
    where.push(`v.user_id IS NOT NULL`);
  }

  if (embedding) {
    values.push(toVectorLiteral(embedding));
    const vectorIdx = values.length;
    const whereSql = `WHERE ${where.join(" AND ")}`;
    const rows = await query<OfferRow>(
      `SELECT ${SELECT_COLUMNS} FROM offers o
       ${JOINS}
       JOIN offer_embeddings e ON e.offer_id = o.offer_id
       ${whereSql}
       ORDER BY e.embedding::halfvec(${EMBEDDING_DIMS}) <=> ($${vectorIdx}::vector(${EMBEDDING_DIMS}))::halfvec(${EMBEDDING_DIMS})
       LIMIT $${vectorIdx + 1} OFFSET $${vectorIdx + 2}`,
      [...values, perPage, (page - 1) * perPage],
    );
    const countRows = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM offers o
        ${JOINS}
        JOIN offer_embeddings e ON e.offer_id = o.offer_id
        WHERE ${where.join(" AND ")}`,
      values.slice(0, vectorIdx - 1),
    );
    const total = Number(countRows[0]?.total ?? 0);
    if (rows.length > 0) {
      return {
        offers: rows.map(mapOffer),
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
        interpretation,
        mode: "semantic",
      };
    }
  }

  // Fallback: keyword search using the extracted terms.
  const terms = interpretation.keywords.length > 0 ? interpretation.keywords : [params.search];
  const kwValues = [...values.slice(0, values.length - (embedding ? 1 : 0))];
  const kwWhere = [...where];
  const ors: string[] = [];
  for (const term of terms.filter(Boolean).slice(0, 5)) {
    kwValues.push(`%${term}%`);
    const idx = kwValues.length;
    ors.push(
      `(o.message_content ILIKE $${idx} OR o.category ILIKE $${idx} OR o.service_type ILIKE $${idx} OR o.seller_username ILIKE $${idx})`,
    );
  }
  if (ors.length > 0) kwWhere.push(`(${ors.join(" OR ")})`);
  const kwWhereSql = `WHERE ${kwWhere.join(" AND ")}`;

  const countRows = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM offers o ${JOINS} ${kwWhereSql}`,
    kwValues,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS} ${kwWhereSql}
     ORDER BY o.is_pinned DESC NULLS LAST, o.timestamp DESC NULLS LAST
     LIMIT $${kwValues.length + 1} OFFSET $${kwValues.length + 2}`,
    [...kwValues, perPage, (page - 1) * perPage],
  );

  return {
    offers: rows.map(mapOffer),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    interpretation,
    mode: "keyword",
  };
}

/** Text that gets embedded for an offer. */
export function embeddingInput(row: {
  message_content: string | null;
  description: string | null;
  category: string | null;
  service_type: string | null;
  post_type: string | null;
  price_display: string | null;
}): string {
  return [
    row.post_type ? `Post type: ${row.post_type}` : "",
    row.category ? `Category: ${row.category}` : "",
    row.service_type ? `Service: ${row.service_type}` : "",
    row.price_display ? `Price: ${row.price_display}` : "",
    (row.description ?? "").trim() || (row.message_content ?? "").trim(),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);
}

type PendingRow = {
  offer_id: number;
  message_content: string | null;
  description: string | null;
  category: string | null;
  service_type: string | null;
  post_type: string | null;
  price_display: string | null;
};

/**
 * Index offers that have no embedding yet (new Discord/website offers).
 * Called opportunistically after a search so the index stays fresh.
 */
export async function indexPendingOffers(limit = 50): Promise<number> {
  const batch = Math.min(Math.max(limit, 1), 100);
  const rows = await query<PendingRow>(
    `SELECT o.offer_id, o.message_content, o.description, o.category, o.service_type,
            o.post_type, o.price_display
       FROM offers o
       LEFT JOIN offer_embeddings e ON e.offer_id = o.offer_id
      WHERE e.offer_id IS NULL
        AND o.message_content IS NOT NULL
        AND length(o.message_content) > 20
      ORDER BY o.timestamp DESC NULLS LAST
      LIMIT $1`,
    [batch],
  );
  if (rows.length === 0) return 0;

  const embeddings = await embedTexts(rows.map((row) => embeddingInput(row)));
  let written = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const embedding = embeddings[i];
    const row = rows[i];
    if (!embedding || !row) continue;
    await query(
      `INSERT INTO offer_embeddings (offer_id, model, content_hash, embedding, updated_at)
       VALUES ($1, $2, md5($3), $4::vector(${EMBEDDING_DIMS}), now())
       ON CONFLICT (offer_id) DO UPDATE
         SET model = EXCLUDED.model, content_hash = EXCLUDED.content_hash,
             embedding = EXCLUDED.embedding, updated_at = now()`,
      [row.offer_id, EMBEDDING_MODEL, embeddingInput(row), toVectorLiteral(embedding)],
    );
    written += 1;
  }
  return written;
}
