/**
 * Built-in Roblox-dev marketplace vocabulary. Used to expand AI-extracted terms
 * and as a rule-based fallback when the AI is unavailable. Pure, client-safe.
 */
import type { PostType } from "@/lib/market-data";
import type { Budget, SearchIntent, Term } from "./ranking";
import { normalize } from "./ranking";

export const CATEGORIES = [
  "Scripting",
  "Building",
  "UI/GUI Design",
  "3D Modeling",
  "Graphics/GFX",
  "Animation",
  "VFX",
  "Sound/Music",
] as const;

type Concept = { term: string; synonyms: string[]; category?: (typeof CATEGORIES)[number]; kind: "skill" | "tech" | "project" };

export const CONCEPTS: Concept[] = [
  { kind: "skill", term: "scripting", category: "Scripting", synonyms: ["scripter", "lua", "luau", "programmer", "programming", "coder", "coding", "code", "scripts", "developer"] },
  { kind: "skill", term: "building", category: "Building", synonyms: ["builder", "build", "map", "maps", "environment", "level design", "terrain", "city"] },
  { kind: "skill", term: "ui design", category: "UI/GUI Design", synonyms: ["ui", "gui", "interface", "ux", "menu", "hud", "ui designer"] },
  { kind: "skill", term: "3d modeling", category: "3D Modeling", synonyms: ["modeler", "modeller", "modeling", "modelling", "blender", "mesh", "3d model", "models"] },
  { kind: "skill", term: "gfx", category: "Graphics/GFX", synonyms: ["graphics", "thumbnail", "thumbnails", "icon", "icons", "render", "logo", "banner", "gfx artist"] },
  { kind: "skill", term: "animation", category: "Animation", synonyms: ["animator", "animations", "animate", "rig", "rigging", "tween", "tweening"] },
  { kind: "skill", term: "vfx", category: "VFX", synonyms: ["effects", "particles", "particle", "visual effects", "vfx artist"] },
  { kind: "skill", term: "sound design", category: "Sound/Music", synonyms: ["sound", "music", "audio", "sfx", "composer", "soundtrack"] },
  { kind: "tech", term: "debugging", synonyms: ["debug", "fix", "fixing", "bug", "bugs", "broken", "error", "errors", "bug fixing", "issue"] },
  { kind: "tech", term: "optimization", synonyms: ["optimize", "optimise", "performance", "lag", "fps", "memory", "efficient", "refactor"] },
  { kind: "tech", term: "datastore", synonyms: ["data store", "datastores", "saving", "save system", "player data", "profileservice", "profile service", "data loss"] },
  { kind: "tech", term: "inventory system", synonyms: ["inventory", "inventories", "backpack", "items system"] },
  { kind: "tech", term: "trading system", synonyms: ["trading", "trade system", "trades"] },
  { kind: "tech", term: "combat system", synonyms: ["combat", "fighting", "pvp", "weapons", "sword"] },
  { kind: "tech", term: "game mechanics", synonyms: ["mechanics", "gameplay", "systems", "game systems", "features"] },
  { kind: "tech", term: "ui animation", synonyms: ["tween", "tweening", "animated ui", "smooth", "transitions"] },
  { kind: "project", term: "rpg", synonyms: ["role playing", "adventure", "quest", "mmorpg"] },
  { kind: "project", term: "roleplay", synonyms: ["rp", "role play", "town", "life"] },
  { kind: "project", term: "simulator", synonyms: ["sim", "simulator game", "clicker"] },
  { kind: "project", term: "tycoon", synonyms: ["tycoons"] },
  { kind: "project", term: "obby", synonyms: ["obstacle course", "parkour"] },
  { kind: "project", term: "horror", synonyms: ["scary"] },
  { kind: "project", term: "fps", synonyms: ["shooter", "gun game"] },
  { kind: "project", term: "anime", synonyms: ["japanese", "naruto", "one piece"] },
];

export function conceptFor(term: string): Concept | undefined {
  const t = normalize(term);
  return CONCEPTS.find((c) => c.term === t || c.synonyms.includes(t));
}

/** Merge AI synonyms with built-in ones so recall survives sparse AI output. */
export function expandTerm(term: string, synonyms: string[] = []): Term {
  const concept = conceptFor(term);
  const all = new Set([...synonyms, ...(concept ? [concept.term, ...concept.synonyms] : [])].map(normalize).filter(Boolean));
  const base = normalize(term);
  all.delete(base);
  return { term: base, synonyms: [...all].slice(0, 14) };
}

function hasPhrase(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `);
}

export function parseBudget(raw: string): Budget | null {
  const text = raw.toLowerCase();
  if (/no budget|not have a budget|without budget/.test(text)) return null;
  const m =
    text.match(/(\$|€|£|usd|eur)\s?(\d+(?:[.,]\d+)?)\s?(k)?/) ??
    text.match(/(\d+(?:[.,]\d+)?)\s?(k)?\s?(\$|€|£|usd|eur|dollars?|robux|rbx|r\$)/) ??
    text.match(/(r\$|robux)\s?(\d+(?:[.,]\d+)?)\s?(k)?/);
  if (!m) return null;
  const sym = (m.find((p, i) => i > 0 && p && /[$€£a-z]/.test(p) && p !== "k") ?? "").toString();
  const num = Number((m.find((p, i) => i > 0 && p && /^\d/.test(p)) ?? "0").replace(",", "."));
  const k = m.slice(1).includes("k") ? 1000 : 1;
  const currency: Budget["currency"] = /robux|rbx|r\$/.test(sym) ? "ROBUX" : /€|eur/.test(sym) ? "EUR" : /£/.test(sym) ? "GBP" : "USD";
  const amount = num * k;
  if (!amount) return null;
  const starting = /starting at|from|min/.test(text);
  return { amount, min: starting ? amount : null, max: starting ? null : amount, currency };
}

/** Which side of the market the searcher is on → which offers they want to see. */
export function inferTargetPostTypes(raw: string): PostType[] {
  const t = normalize(raw);
  if (/\b(i can|i will|i offer|i make|i create|i do|available for|for hire|my services|hire me)\b/.test(t)) return ["hiring"];
  if (/\b(selling|for sale)\b/.test(t)) return ["buying"];
  if (/\b(buy|buying|purchase)\b/.test(t)) return ["selling"];
  if (/\b(invest|investor|funding)\b/.test(t)) return ["investment"];
  if (/\b(need|needs|looking for|seeking|want|hire|hiring|searching|someone|anyone|who can)\b/.test(t)) return ["forhire"];
  return [];
}

/** Deterministic intent extraction — used alone if the AI fails, and to enrich AI output. */
export function ruleBasedIntent(raw: string): SearchIntent {
  const t = normalize(raw);
  const skills: Term[] = [];
  const tech: Term[] = [];
  let project: Term | null = null;
  const categories = new Set<string>();
  for (const c of CONCEPTS) {
    const hit = [c.term, ...c.synonyms].some((s) => s.length > 2 && hasPhrase(t, s));
    if (!hit) continue;
    const term = expandTerm(c.term);
    if (c.kind === "skill") {
      skills.push(term);
      if (c.category) categories.add(c.category);
    } else if (c.kind === "tech") tech.push(term);
    else project ??= term;
  }
  const payments = ["paypal", "robux", "crypto", "usd", "giftcard", "percentage"].filter((p) => hasPhrase(t, p));
  return {
    semanticQuery: raw.trim(),
    categories: [...categories],
    skills,
    technicalRequirements: tech,
    projectType: project,
    targetPostTypes: inferTargetPostTypes(raw),
    budget: parseBudget(raw),
    paymentMethods: payments,
    experienceRequired: /\b(experienced|experience|expert|senior|professional|skilled)\b/.test(t),
    revenueShare: /\b(revenue share|rev share|revshare|percentage|% of)\b/.test(t) || /revenue/.test(t),
    verifiedOnly: /\bverified\b/.test(t),
  };
}
