/** Client-safe shape + option lists for the "post an offer" form. */

export const OFFER_CATEGORIES = [
  "Scripting",
  "Building",
  "UI/GUI Design",
  "3D Modeling",
  "Graphics/GFX",
  "Animation",
  "VFX",
  "Sound/Music",
  "Other",
] as const;

export const OFFER_POST_TYPES = [
  { value: "Selling", label: "Selling a service or asset" },
  { value: "For Hire", label: "For hire (offering my work)" },
  { value: "Hiring", label: "Hiring (looking for someone)" },
  { value: "Buying", label: "Buying" },
  { value: "Seeking Investment", label: "Seeking investment" },
] as const;

export const PAYMENT_METHODS = ["Robux", "USD", "PayPal", "Crypto", "Group Funds"] as const;

export type PostOfferInput = {
  title: string;
  description: string;
  category: string;
  postType: string;
  priceDisplay: string;
  paymentMethods: string[];
  contactUrl: string;
  imageUrl: string;
};

export const MAX_TITLE = 96;
export const MAX_DESCRIPTION = 4000;

/** Shared validation so the client shows the same errors the server enforces. */
export function validatePostOffer(input: PostOfferInput): string[] {
  const errors: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length < 8) errors.push("Title must be at least 8 characters.");
  if (title.length > MAX_TITLE) errors.push(`Title must be under ${MAX_TITLE} characters.`);
  if (description.length < 40) errors.push("Description must be at least 40 characters.");
  if (description.length > MAX_DESCRIPTION)
    errors.push(`Description must be under ${MAX_DESCRIPTION} characters.`);
  if (!OFFER_CATEGORIES.includes(input.category as (typeof OFFER_CATEGORIES)[number]))
    errors.push("Pick a category.");
  if (!OFFER_POST_TYPES.some((type) => type.value === input.postType))
    errors.push("Pick a post type.");
  if (input.priceDisplay.trim().length > 44) errors.push("Price is too long.");

  for (const [field, value] of [
    ["Contact link", input.contactUrl],
    ["Image link", input.imageUrl],
  ] as const) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (!/^https:\/\/[^\s]+$/i.test(trimmed)) errors.push(`${field} must be a https:// URL.`);
  }

  return errors;
}
