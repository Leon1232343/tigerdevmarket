/**
 * Pure relevance ranking for marketplace search. No I/O — unit-testable.
 * Weights: semantic 40%, service/skill 25%, technical 15%, project 10%, context 10%.
 * Missing query components redistribute their weight to the ones present.
 */
import type { PostType } from "@/lib/market-data";

export type Term = { term: string; synonyms: string[] };

export type Budget = {
  amount: number | null;
  min: number | null;
  max: number | null;
  currency: "USD" | "EUR" | "GBP" | "ROBUX" | null;
};

export type SearchIntent = {
  semanticQuery: string;
  /** Canonical marketplace categories requested. */
  categories: string[];
  /** Requested services and required skills, each with synonyms. */
  skills: Term[];
  technicalRequirements: Term[];
  projectType: Term | null;
  /** Post type of the offers the searcher wants to see. */
  targetPostTypes: PostType[];
  budget: Budget | null;
  paymentMethods: string[];
  experienceRequired: boolean;
  revenueShare: boolean;
  verifiedOnly: boolean;
};

export const WEIGHTS = {
  semantic: 0.4,
  service: 0.25,
  technical: 0.15,
  project: 0.1,
  context: 0.1,
} as const;

/** Thresholds tuned against the test queries (see search.test.ts). */
export const EXACT_THRESHOLD = 0.5;
export const RELATED_THRESHOLD = 0.3;

export type RankInput = {
  id: string;
  text: string;
  categories: string[];
  postType: PostType;
  paymentMethods: string[];
  priceDisplay: string;
  priceMin: number | null;
  priceMax: number | null;
  pinned: boolean;
  boosted: boolean;
  postedAt: string | null;
  /** Cosine similarity to the query embedding, null when unavailable. */
  similarity: number | null;
};

export type MatchInfo = {
  score: number; // 0-100
  tier: "exact" | "related";
  reason: string;
  matchedSkills: string[];
  missing: string[];
};

export type Ranked = { id: string; relevance: number; final: number; match: MatchInfo };

// ---------- text helpers ----------

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/<a?:\w+:\d+>/g, " ")
    .replace(/[^a-z0-9$€£%+#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

export type Doc = { text: string; tokens: Set<string> };

export function makeDoc(text: string): Doc {
  const norm = ` ${normalize(text)} `;
  return { text: norm, tokens: new Set(norm.trim().split(" ")) };
}

function stem(word: string): string {
  return word.replace(/(ing|ers|er|es|s|ed)$/, "");
}

/** 1 = exact phrase/synonym, 0.75 = stem or typo-tolerant match, 0 = none. */
export function matchPhrase(phrase: string, doc: Doc): number {
  const p = normalize(phrase);
  if (!p) return 0;
  if (doc.text.includes(` ${p} `)) return 1;
  const words = p.split(" ");
  if (words.length === 1) {
    const w = words[0]!;
    if (w.length >= 4) {
      const s = stem(w);
      for (const token of doc.tokens) {
        if (token.length >= 4 && stem(token) === s) return 0.85;
      }
      if (w.length >= 5) {
        const max = w.length >= 8 ? 2 : 1;
        for (const token of doc.tokens) {
          if (token[0] === w[0] && editDistance(w, token, max) <= max) return 0.75;
        }
      }
    }
    return 0;
  }
  // multi-word: all words present (any order) counts as a partial match
  const hits = words.filter((w) => w.length <= 2 || matchPhrase(w, doc) > 0).length;
  return hits === words.length ? 0.8 : 0;
}

export function matchTerm(term: Term, doc: Doc): number {
  let best = matchPhrase(term.term, doc);
  for (const syn of term.synonyms) {
    if (best >= 1) break;
    best = Math.max(best, matchPhrase(syn, doc) * 0.95);
  }
  return best;
}

// ---------- price helpers ----------

export function detectCurrency(display: string): Budget["currency"] {
  const d = display.toLowerCase();
  if (/robux|\br\$|\brbx\b|\d\s*r\b/.test(d)) return "ROBUX";
  if (/\$|usd|dollar/.test(d)) return "USD";
  if (/€|eur/.test(d)) return "EUR";
  if (/£|gbp/.test(d)) return "GBP";
  return null;
}

export function parseAmounts(display: string): number[] {
  return [...display.toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*(k)?/g)]
    .map((m) => Number(m[1]!.replace(",", ".")) * (m[2] ? 1000 : 1))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** 1 = price fits budget, 0.5 = unknown/other currency, 0 = clearly over budget. */
export function budgetFit(budget: Budget, offer: RankInput): number {
  const target = budget.max ?? budget.amount;
  if (target == null) return 0.5;
  const currency = detectCurrency(offer.priceDisplay);
  if (!currency || (budget.currency && currency !== budget.currency)) return 0.5;
  const amounts = parseAmounts(offer.priceDisplay);
  if (amounts.length === 0) return 0.5;
  const low = Math.min(...amounts);
  if (low <= target * 1.2) return 1;
  if (low <= target * 2) return 0.4;
  return 0;
}

// ---------- scoring ----------

const EXPERIENCE_TERMS = ["experienced", "experience", "years", "portfolio", "professional", "expert", "senior", "advanced"];
const REVSHARE_TERMS = ["revenue share", "rev share", "revshare", "percentage", "percent", "%"];

export function semanticScore(similarity: number | null): number | null {
  if (similarity == null) return null;
  // Gemini embedding cosine for related texts sits around 0.55–0.8.
  return Math.min(1, Math.max(0, (similarity - 0.55) / 0.22));
}

function coverage(terms: Term[], doc: Doc) {
  const scored = terms.map((t) => ({ t, s: matchTerm(t, doc) }));
  const total = scored.reduce((sum, x) => sum + x.s, 0);
  return {
    score: terms.length ? total / terms.length : 0,
    matched: scored.filter((x) => x.s > 0).map((x) => x.t.term),
    missing: scored.filter((x) => x.s === 0).map((x) => x.t.term),
  };
}

export function scoreOffer(intent: SearchIntent, offer: RankInput, now = Date.now()): Ranked | null {
  const doc = makeDoc(`${offer.categories.join(" ")} ${offer.text}`);
  const parts: { key: keyof typeof WEIGHTS; value: number }[] = [];

  const sem = semanticScore(offer.similarity);
  if (sem != null) parts.push({ key: "semantic", value: sem });

  // Service & skill match
  const skills = coverage(intent.skills, doc);
  let service: number | null = null;
  if (intent.categories.length || intent.skills.length) {
    const offerCats = offer.categories.map((c) => c.toLowerCase());
    const catHits = intent.categories.filter((c) => offerCats.includes(c.toLowerCase())).length;
    // Offers listing every category are less specific than focused ones.
    const specificity = 1 / (1 + 0.12 * Math.max(0, offerCats.length - 1));
    const cat = intent.categories.length ? (catHits / intent.categories.length) * specificity : null;
    service = cat == null ? skills.score : intent.skills.length ? 0.4 * cat + 0.6 * skills.score : cat;
    parts.push({ key: "service", value: service });
  }

  const tech = coverage(intent.technicalRequirements, doc);
  if (intent.technicalRequirements.length) parts.push({ key: "technical", value: tech.score });

  const project = intent.projectType ? matchTerm(intent.projectType, doc) : null;
  if (project != null) parts.push({ key: "project", value: project });

  // Additional context
  const ctx: number[] = [];
  const postMatch = intent.targetPostTypes.length ? intent.targetPostTypes.includes(offer.postType) : null;
  if (postMatch != null) ctx.push(postMatch ? 1 : 0, postMatch ? 1 : 0);
  if (intent.paymentMethods.length) {
    const pm = offer.paymentMethods.map((m) => m.toLowerCase());
    ctx.push(intent.paymentMethods.some((m) => pm.some((p) => p.includes(m.toLowerCase()))) ? 1 : 0.3);
  }
  if (intent.budget) ctx.push(budgetFit(intent.budget, offer));
  if (intent.experienceRequired) ctx.push(EXPERIENCE_TERMS.some((t) => matchPhrase(t, doc) > 0) ? 1 : 0.4);
  if (intent.revenueShare) ctx.push(REVSHARE_TERMS.some((t) => doc.text.includes(t)) ? 1 : 0.2);
  if (ctx.length) parts.push({ key: "context", value: ctx.reduce((a, b) => a + b, 0) / ctx.length });

  if (parts.length === 0) return null;
  const weightSum = parts.reduce((sum, p) => sum + WEIGHTS[p.key], 0);
  let relevance = parts.reduce((sum, p) => sum + WEIGHTS[p.key] * p.value, 0) / weightSum;

  // Wrong side of the market (e.g. another "Hiring" post when you want to hire) is heavily demoted.
  if (postMatch === false) relevance *= 0.6;

  // A shared keyword alone is not relevance: require a real service or semantic signal.
  const hasService = service != null && service >= 0.3;
  const hasSemantic = sem != null && sem >= 0.45;
  if (!hasService && !hasSemantic) return null;
  if (relevance < RELATED_THRESHOLD) return null;

  // Secondary modifiers — capped so they only break near-ties.
  const ageDays = offer.postedAt ? (now - Date.parse(offer.postedAt)) / 86_400_000 : 365;
  const secondary =
    (offer.pinned ? 0.02 : 0) + (offer.boosted ? 0.02 : 0) + 0.01 * Math.max(0, 1 - ageDays / 90);

  const matchedSkills = [...new Set([...skills.matched, ...tech.matched, ...(project && intent.projectType ? [intent.projectType.term] : [])])];
  const missing = [...skills.missing, ...tech.missing];
  if (intent.budget && budgetFit(intent.budget, offer) === 0) missing.push("over your budget");
  if (intent.revenueShare && !REVSHARE_TERMS.some((t) => doc.text.includes(t))) missing.push("revenue share not mentioned");

  const tier: MatchInfo["tier"] =
    relevance >= EXACT_THRESHOLD && (service == null || service >= 0.45) && postMatch !== false ? "exact" : "related";

  return {
    id: offer.id,
    relevance,
    final: relevance + secondary,
    match: {
      score: Math.round(relevance * 100),
      tier,
      reason: buildReason(tier, matchedSkills, offer, intent),
      matchedSkills: matchedSkills.slice(0, 6),
      missing: missing.slice(0, 4),
    },
  };
}

function buildReason(tier: MatchInfo["tier"], matched: string[], offer: RankInput, intent: SearchIntent): string {
  const bits: string[] = [];
  if (matched.length) bits.push(`Covers ${matched.slice(0, 3).join(", ")}`);
  else if (intent.categories.some((c) => offer.categories.includes(c))) bits.push(`Offers ${intent.categories.join(" & ")}`);
  else bits.push("Similar to what you described");
  if (tier === "related") bits.push("related alternative");
  return bits.join(" · ");
}

export function rankOffers(intent: SearchIntent, offers: RankInput[], now = Date.now()): Ranked[] {
  return offers
    .map((o) => scoreOffer(intent, o, now))
    .filter((r): r is Ranked => r !== null)
    .sort((a, b) => {
      if (a.match.tier !== b.match.tier) return a.match.tier === "exact" ? -1 : 1;
      return b.final - a.final;
    });
}
