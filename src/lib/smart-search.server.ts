/**
 * AI smart search over the external offers database.
 * Turns free-form text into structured marketplace filters, then matches offers
 * with keyword search. Several OpenAI-compatible providers are tried in order,
 * so one rate-limited or unconfigured service does not disable the feature.
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

type ProviderConfig = {
  id: string;
  label: string;
  /** Environment variables checked in order; the first one that is set wins. */
  keyEnv: string[];
  url: string;
  model: string;
  /** Request fields this provider understands (token limits differ per vendor). */
  extra: Record<string, unknown>;
};

/**
 * Ordered by free daily headroom, so the provider with the most left is tried
 * first: NVIDIA NIM ~10k requests/day, Groq ~1k/day, OpenRouter 50/day on free
 * models, Cerebras trial. All speak the OpenAI chat-completions shape, so one
 * request builder covers every one of them.
 */
export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    keyEnv: ["NVIDIA_API_KEY", "NVIDIA_NIM_API_KEY"],
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "openai/gpt-oss-20b",
    // Same reasoning-model caveat as Groq: the budget must cover thinking + JSON.
    extra: { max_tokens: 1500 },
  },
  {
    id: "groq",
    label: "Groq",
    keyEnv: ["GROQ_API_KEY"],
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "openai/gpt-oss-120b",
    extra: {
      // gpt-oss spends completion tokens on reasoning first: too small a budget
      // returns an empty message, so give it room and keep the reasoning short.
      reasoning_effort: "low",
      max_completion_tokens: 1500,
      response_format: { type: "json_object" },
    },
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyEnv: ["OPENROUTER_API_KEY"],
    url: "https://openrouter.ai/api/v1/chat/completions",
    // The router picks whichever free model is available right now.
    model: "openrouter/free",
    extra: { max_tokens: 900 },
  },
  {
    id: "cerebras",
    label: "Cerebras",
    keyEnv: ["CEREBRAS_API_KEY"],
    url: "https://api.cerebras.ai/v1/chat/completions",
    model: "gpt-oss-120b",
    extra: { max_tokens: 900 },
  },
];

function providerKey(provider: ProviderConfig): string | null {
  for (const name of provider.keyEnv) {
    const value = process.env[name];
    if (value) return value;
  }
  return null;
}

/** Which providers have a key, for the status chip in /admin. */
export function configuredProviders(): { id: string; label: string; configured: boolean }[] {
  return AI_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    configured: providerKey(provider) !== null,
  }));
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
   * True when no model answered (no key, HTTP error, unusable reply).
   * The UI says so instead of pretending the query was understood.
   */
  aiFailed: boolean;
  /** Short machine-readable reason, e.g. "no_provider_configured". */
  aiReason: string | null;
  /** Provider that produced this interpretation, or null when it failed. */
  aiProvider: string | null;
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

const SYSTEM_PROMPT = `You turn a Roblox developer marketplace search query into JSON filters.
Allowed "category" values: ${CATEGORIES.join(", ")} or null.
Allowed "postType" values: hiring, forhire, buying, selling, investment, or null.
Return ONLY JSON with keys: semanticQuery (string, cleaned English description of what the user wants),
keywords (array of up to 5 short lowercase terms), category, postType,
verifiedOnly (boolean), minPrice (number in Robux or null), maxPrice (number in Robux or null).
The query may be in any language; semanticQuery must be English.`;

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
  aiProvider: null,
};

/** Keyword matching still runs, so a failed model call degrades instead of breaking. */
function failed(text: string, reason: string): Interpretation {
  return {
    ...EMPTY_INTERPRETATION,
    semanticQuery: text,
    aiFailed: true,
    aiReason: reason.slice(0, 200),
  };
}

/** Interpret without asking a model, e.g. when the caller is over its budget. */
export function keywordOnly(text: string, reason: string): Interpretation {
  return failed(text, reason);
}

/** Models often wrap JSON in prose or fences; take the outermost object. */
function extractJson(content: string): Record<string, unknown> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(content.slice(start, end + 1)) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function askProvider(
  provider: ProviderConfig,
  text: string,
): Promise<Record<string, unknown> | null> {
  const key = providerKey(provider);
  if (!key) return null;

  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0,
      ...provider.extra,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    console.error(`Smart search ${provider.id} [${response.status}]: ${body}`);
    throw new Error(`http_${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return extractJson(payload.choices?.[0]?.message?.content ?? "");
}

function toInterpretation(parsed: Record<string, unknown>, text: string, id: string) {
  const rawCategory = parsed["category"];
  const rawPostType = parsed["postType"];
  const category =
    typeof rawCategory === "string"
      ? (CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ?? null)
      : null;
  const postTypes = new Set(Object.values(POST_TYPE_MAP));
  const postType =
    typeof rawPostType === "string" && postTypes.has(rawPostType as PostType)
      ? (rawPostType as PostType)
      : null;
  const semantic = parsed["semanticQuery"];
  const keywords = parsed["keywords"];
  const minPrice = Number(parsed["minPrice"]);
  const maxPrice = Number(parsed["maxPrice"]);

  return {
    semanticQuery:
      typeof semantic === "string" && semantic.trim() ? semantic.trim().slice(0, 300) : text,
    keywords: Array.isArray(keywords)
      ? keywords
          .filter((keyword): keyword is string => typeof keyword === "string")
          .map((keyword) => keyword.trim().toLowerCase().slice(0, 32))
          .filter(Boolean)
          .slice(0, 5)
      : [],
    category,
    postType,
    verifiedOnly: parsed["verifiedOnly"] === true,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    aiFailed: false,
    aiReason: null,
    aiProvider: id,
  } satisfies Interpretation;
}

/** Ask the first provider that answers to turn text into marketplace filters. */
export async function interpretQuery(raw: string): Promise<Interpretation> {
  const text = raw.trim().slice(0, 300);
  if (!text) return EMPTY_INTERPRETATION;

  const usable = AI_PROVIDERS.filter((provider) => providerKey(provider) !== null);
  if (usable.length === 0) {
    console.error("Smart search: no AI provider key configured");
    return failed(text, "no_provider_configured");
  }

  const reasons: string[] = [];
  for (const provider of usable) {
    try {
      const parsed = await askProvider(provider, text);
      if (!parsed) {
        console.error(`Smart search ${provider.id}: no usable JSON in the reply`);
        reasons.push(`${provider.id}:unusable_reply`);
        continue;
      }
      return toInterpretation(parsed, text, provider.id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "request_failed";
      reasons.push(`${provider.id}:${reason}`);
    }
  }

  return failed(text, reasons.join(", ") || "request_failed");
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
  /** Skips the model call and matches keywords directly (rate limiting). */
  skipAi?: boolean;
}): Promise<SmartSearchResult> {
  const perPage = Math.min(Math.max(params.perPage ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const interpretation = params.skipAi
    ? keywordOnly(params.search, "rate_limited")
    : await interpretQuery(params.search);

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
