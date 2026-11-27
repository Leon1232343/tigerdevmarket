/**
 * AI smart search over the external offers database.
 * Uses the Groq API (free tier, OpenAI-compatible) to turn free-form text into
 * structured marketplace filters, then matches offers with keyword search.
 * Server-only — never import from client code.
 */
import {
  query,
  mapOffer,
  SELECT_COLUMNS,
  JOINS,
  POST_TYPE_MAP,
  QUALITY_WHERE,
} from "@/lib/offers.server";
import type { OfferRow } from "@/lib/offers.server";
import type { Offer, PostType } from "@/lib/market-data";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
// Free tier: highest rate limits among Groq's current production models.
const CHAT_MODEL = "openai/gpt-oss-120b";

function apiKey(): string | null {
  return process.env["GROQ_API_KEY"] ?? null;
}

export type Interpretation = {
  semanticQuery: string;
  keywords: string[];
  category: string | null;
  postType: PostType | null;
  verifiedOnly: boolean;
  maxPrice: number | null;
  minPrice: number | null;
  /**
   * True when the model could not be asked (no key, HTTP error, unusable reply).
   * The UI says so instead of pretending the query was understood.
   */
  aiFailed: boolean;
  /** Short machine-readable reason, e.g. "not_configured" or "http_429". */
  aiReason: string | null;
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
  aiFailed: false,
  aiReason: null,
};

/** Keyword matching still runs, so a failed model call degrades instead of breaking. */
function failed(text: string, reason: string): Interpretation {
  return { ...EMPTY_INTERPRETATION, semanticQuery: text, aiFailed: true, aiReason: reason };
}

/** Ask the model to turn free-form text into structured marketplace filters. */
export async function interpretQuery(raw: string): Promise<Interpretation> {
  const text = raw.trim().slice(0, 300);
  if (!text) return EMPTY_INTERPRETATION;

  const key = apiKey();
  if (!key) {
    console.error("Smart search: GROQ_API_KEY is not configured");
    return failed(text, "not_configured");
  }

  const system = `You turn a Roblox developer marketplace search query into JSON filters.
Allowed "category" values: ${CATEGORIES.join(", ")} or null.
Allowed "postType" values: hiring, forhire, buying, selling, investment, or null.
Return ONLY JSON with keys: semanticQuery (string, cleaned English description of what the user wants),
keywords (array of up to 5 short lowercase terms), category, postType,
verifiedOnly (boolean), minPrice (number in Robux or null), maxPrice (number in Robux or null).
The query may be in any language; semanticQuery must be English.`;

  try {
    const response = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0,
        // gpt-oss spends completion tokens on reasoning first: too small a budget
        // returns an empty message, so give it room and keep the reasoning short.
        reasoning_effort: "low",
        max_completion_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });
    if (!response.ok) {
      console.error(`Smart search interpret failed [${response.status}]: ${await response.text()}`);
      return failed(text, `http_${response.status}`);
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    if (!content.trim() || content.trim() === "{}") {
      console.error("Smart search: the model returned no usable JSON");
      return failed(text, "empty_model_output");
    }
    const parsed = JSON.parse(content) as Partial<Interpretation>;

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
      aiFailed: false,
      aiReason: null,
    };
  } catch (error) {
    console.error("Smart search interpret error", error);
    return failed(text, "request_failed");
  }
}

export type SmartSearchResult = {
  offers: Offer[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  interpretation: Interpretation;
  mode: "keyword";
};

export async function smartSearchOffers(params: {
  search: string;
  page?: number;
  perPage?: number;
}): Promise<SmartSearchResult> {
  const perPage = Math.min(Math.max(params.perPage ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const interpretation = await interpretQuery(params.search);

  const where: string[] = [...QUALITY_WHERE];
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

  // Keyword match using the terms the model extracted (or the raw query).
  const terms = interpretation.keywords.length > 0 ? interpretation.keywords : [params.search];
  const ors: string[] = [];
  for (const term of terms.filter(Boolean).slice(0, 5)) {
    values.push(`%${term}%`);
    const idx = values.length;
    ors.push(
      `(o.message_content ILIKE $${idx} OR o.category ILIKE $${idx} OR o.service_type ILIKE $${idx} OR o.seller_username ILIKE $${idx})`,
    );
  }
  if (ors.length > 0) where.push(`(${ors.join(" OR ")})`);
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const countRows = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM offers o ${JOINS} ${whereSql}`,
    values,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const rows = await query<OfferRow>(
    `SELECT ${SELECT_COLUMNS} FROM offers o ${JOINS} ${whereSql}
     ORDER BY o.is_pinned DESC NULLS LAST, o.timestamp DESC NULLS LAST
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, perPage, (page - 1) * perPage],
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
