/**
 * Presentation data for Tiger Market.
 * Shapes mirror the intended relational schema (users, offers, categories,
 * reviews, trade confirmations) so markup can be ported to server-side
 * templates with minimal changes.
 */

export type PostType = "hiring" | "forhire" | "buying" | "selling" | "investment";
export type OfferSource = "discord" | "website";

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "hiring", label: "Hiring" },
  { value: "forhire", label: "For Hire" },
  { value: "buying", label: "Buying" },
  { value: "selling", label: "Selling" },
  { value: "investment", label: "Investment" },
];

export const postTypeClass: Record<PostType, string> = {
  hiring: "bg-type-hiring",
  forhire: "bg-type-forhire",
  buying: "bg-type-buying",
  selling: "bg-type-selling",
  investment: "bg-type-investment",
};

export type Category = {
  slug: string;
  name: string;
  icon: string;
  listings: number;
};

export const CATEGORIES: Category[] = [
  { slug: "scripting", name: "Scripting", icon: "⌘", listings: 412 },
  { slug: "building", name: "Building", icon: "▦", listings: 268 },
  { slug: "ui-design", name: "UI / GUI Design", icon: "◲", listings: 174 },
  { slug: "modeling", name: "3D Modeling", icon: "◈", listings: 131 },
  { slug: "gfx", name: "Graphics / GFX", icon: "◐", listings: 96 },
  { slug: "animation", name: "Animation", icon: "➤", listings: 74 },
  { slug: "investment", name: "Investment", icon: "◆", listings: 41 },
  { slug: "audio", name: "Audio / SFX", icon: "♪", listings: 22 },
];

export type Offer = {
  publicId: string;
  title: string;
  excerpt: string;
  description: string[];
  category: string;
  postType: PostType;
  source: OfferSource;
  seller: string;
  verified: boolean;
  price: string;
  rating: number;
  reviews: number;
  thumbnail: boolean;
  scamWarning?: string;
  originalUrl: string;
};

export const OFFERS: Offer[] = [
  {
    publicId: "a41f9c02",
    title: "Advanced combat system scripting (Luau)",
    excerpt:
      "Full hitbox-based melee and ranged combat with server authority, anti-exploit checks and replication tuning.",
    description: [
      "I build production combat systems used in games with 10k+ CCU. Server-authoritative hit registration, lag compensation, cooldown validation and modular weapon definitions.",
      "Delivery includes documented modules, a test place, and two weeks of bug support after handoff.",
    ],
    category: "Scripting",
    postType: "forhire",
    source: "discord",
    seller: "vex_scripts",
    verified: true,
    price: "R$ 24,000",
    rating: 4.8,
    reviews: 63,
    thumbnail: true,
    originalUrl: "#original-post",
  },
  {
    publicId: "7d20be55",
    title: "Hiring builder for low-poly city map",
    excerpt:
      "Need a stylised low-poly downtown block, roughly 12 buildings plus street props. Paid per milestone.",
    description: [
      "Long-term project, milestone based payments through a trusted middleman. Reference board provided on request.",
      "Looking for someone comfortable with modular kits and part budgets under 8k parts for the full map.",
    ],
    category: "Building",
    postType: "hiring",
    source: "website",
    seller: "northgate_dev",
    verified: false,
    price: "R$ 40,000",
    rating: 4.2,
    reviews: 11,
    thumbnail: false,
    scamWarning:
      "This account is less than 14 days old and has no completed trades. Use a verified middleman and never pay upfront in full.",
    originalUrl: "#original-post",
  },
  {
    publicId: "c9e1a730",
    title: "Clean minimal UI kit — shop, inventory, settings",
    excerpt:
      "Cohesive GUI kit with animated transitions, mobile-safe scaling and a ready-to-drop ModuleScript controller.",
    description: [
      "Includes shop, inventory grid, settings, and a toast system. All frames use UIScale and safe-area padding so it holds up on phones.",
      "Figma source file included so you can restyle colors without touching Studio.",
    ],
    category: "UI / GUI Design",
    postType: "selling",
    source: "website",
    seller: "mira.ui",
    verified: true,
    price: "R$ 6,500",
    rating: 4.9,
    reviews: 128,
    thumbnail: true,
    originalUrl: "#original-post",
  },
  {
    publicId: "1b884fe9",
    title: "Rigged character models + animation pack",
    excerpt:
      "Three R15-compatible characters with idle, walk, sprint and emote sets, exported and Studio-tested.",
    description: [
      "Blender source files plus FBX exports. Rigs are weight-painted and tested against Roblox's animation editor.",
      "Custom emotes can be added for an additional fee per animation.",
    ],
    category: "3D Modeling",
    postType: "selling",
    source: "discord",
    seller: "polyforge",
    verified: true,
    price: "R$ 15,750",
    rating: 4.6,
    reviews: 47,
    thumbnail: true,
    originalUrl: "#original-post",
  },
  {
    publicId: "5fa60c18",
    title: "Buying thumbnail + icon set for horror game",
    excerpt:
      "Looking for moody GFX: one thumbnail, one icon, consistent lighting. Fast turnaround preferred.",
    description: [
      "Need delivery within five days. Portfolio required before we discuss price.",
      "Payment via group funds after first draft approval.",
    ],
    category: "Graphics / GFX",
    postType: "buying",
    source: "discord",
    seller: "dim_hollow",
    verified: false,
    price: "R$ 9,000",
    rating: 4.0,
    reviews: 6,
    thumbnail: false,
    originalUrl: "#original-post",
  },
  {
    publicId: "e07c2ab4",
    title: "Investment: 20% revenue share in tycoon project",
    excerpt:
      "Seeking funding for ads and asset commissions on a near-finished tycoon with a playtested core loop.",
    description: [
      "Analytics from the closed test are available under NDA: 34% D1 retention across 2,100 sessions.",
      "Terms drafted in writing before any funds move. Escrow through a mutually agreed middleman.",
    ],
    category: "Investment",
    postType: "investment",
    source: "website",
    seller: "atlas_studios",
    verified: true,
    price: "R$ 120,000",
    rating: 4.5,
    reviews: 19,
    thumbnail: true,
    scamWarning:
      "Investment offers carry no platform guarantee. Tiger Market does not escrow funds — verify all terms independently.",
    originalUrl: "#original-post",
  },
  {
    publicId: "b3391d6a",
    title: "Systems programmer — data stores & economy",
    excerpt:
      "Session-locked ProfileStore setup, currency sinks, purchase validation and analytics events.",
    description: [
      "I specialise in the unglamorous layer: saving that never loses data, and economies that don't inflate.",
      "Includes migration scripts for existing player data.",
    ],
    category: "Scripting",
    postType: "forhire",
    source: "discord",
    seller: "quill_dev",
    verified: true,
    price: "R$ 18,200",
    rating: 4.7,
    reviews: 82,
    thumbnail: false,
    originalUrl: "#original-post",
  },
  {
    publicId: "9cc4f281",
    title: "Hiring animator for melee weapon set",
    excerpt:
      "Eight weapons, three animations each. Stylised and snappy, references supplied up front.",
    description: [
      "Paid per weapon set on delivery. Revisions capped at two rounds per animation.",
      "Preference for animators with combat game experience.",
    ],
    category: "Animation",
    postType: "hiring",
    source: "website",
    seller: "grim_workshop",
    verified: false,
    price: "R$ 11,400",
    rating: 4.3,
    reviews: 14,
    thumbnail: true,
    originalUrl: "#original-post",
  },
  {
    publicId: "44a7e0b3",
    title: "Ambient audio & SFX pass for obby",
    excerpt:
      "Loopable ambience beds plus 20 interaction SFX, mixed and normalised for Roblox playback.",
    description: [
      "All audio is original and license-clear for commercial Roblox use.",
      "Delivered as tagged assets with a volume/rolloff sheet.",
    ],
    category: "Audio / SFX",
    postType: "selling",
    source: "website",
    seller: "loopcabin",
    verified: true,
    price: "R$ 4,800",
    rating: 4.4,
    reviews: 29,
    thumbnail: false,
    originalUrl: "#original-post",
  },
];

export function getOffer(publicId: string): Offer | undefined {
  return OFFERS.find((offer) => offer.publicId === publicId);
}
