/**
 * Shared client-safe types and presentation maps for Tiger Market.
 * Live offer data comes from the external offers database via
 * `src/lib/offers.functions.ts`.
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

export type Offer = {
  publicId: string;
  title: string;
  excerpt: string;
  description: string[];
  category: string;
  categories: string[];
  postType: PostType;
  source: OfferSource;
  seller: string;
  sellerId: string | null;
  verified: boolean;
  price: string;
  paymentMethods: string[];
  rating: number;
  reviews: number;
  thumbnail: boolean;
  imageUrl: string | null;
  serverName: string | null;
  postedAt: string | null;
  scamWarning?: string | undefined;
  originalUrl: string;
  /** Pinned by the Tiger Market team — shown as “Featured” and sorted first. */
  pinned?: boolean;
  /** Seller has an active boost — shown as “Boosted”. */
  boosted?: boolean;
};
