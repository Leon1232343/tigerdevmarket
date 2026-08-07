/**
 * Server-only writes to the external Tiger Market offers database.
 * Never import this from client code.
 */
import { query } from "@/lib/offers.server";
import { validatePostOffer, type PostOfferInput } from "@/lib/post-offer-schema";
import type { SessionUser } from "@/lib/auth.server";

const MAX_PER_DAY = 5;

export type CreateOfferResult = { offerId: number };

/** Number of offers this seller posted through the website in the last 24h. */
async function recentCount(discordId: string): Promise<number> {
  const rows = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM offers
     WHERE source = 'website' AND seller_id = $1 AND timestamp > now() - interval '24 hours'`,
    [discordId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function createWebsiteOffer(
  user: SessionUser,
  input: PostOfferInput,
): Promise<CreateOfferResult> {
  const errors = validatePostOffer(input);
  if (errors.length > 0) throw new Error(errors[0]);

  if ((await recentCount(user.discordId)) >= MAX_PER_DAY)
    throw new Error(`You can post up to ${MAX_PER_DAY} offers per day. Try again later.`);

  const title = input.title.trim();
  const description = input.description.trim();
  const price = input.priceDisplay.trim() || "Negotiable";
  const payment = input.paymentMethods.slice(0, 5).join(", ") || null;
  const contact = input.contactUrl.trim() || null;
  const image = input.imageUrl.trim() || null;

  const rows = await query<{ offer_id: number }>(
    `INSERT INTO offers (
       server_name, seller_username, seller_id, service_type, category, post_type,
       price_display, price_min, price_max, payment_method, message_content, description,
       jump_link, image_url, source, timestamp
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,$8,$9,$10,$11,$12,'website', now())
     RETURNING offer_id`,
    [
      "Tiger Market Website",
      user.displayName ?? user.username,
      user.discordId,
      input.category,
      input.category,
      input.postType,
      price,
      payment,
      `${title}\n\n${description}`,
      description,
      contact,
      image,
    ],
  );

  const offerId = rows[0]?.offer_id;
  if (!offerId) throw new Error("Could not save your offer. Please try again.");
  return { offerId };
}
