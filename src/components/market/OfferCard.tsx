import { Link } from "@tanstack/react-router";
import { POST_TYPES, postTypeClass, type Offer } from "@/lib/market-data";
import { relativeTime } from "@/lib/offer-format";
import { responsiveOfferImage } from "@/lib/offer-images";
import { Stars } from "./Stars";
import { FavoriteButton } from "./FavoriteButton";

/**
 * The whole card is clickable through a stretched link; the favorite button
 * sits above it so toggling never navigates (a button inside an <a> would be
 * invalid HTML and would follow the link on every click).
 */
export function OfferCard({ offer }: { offer: Offer }) {
  const image = responsiveOfferImage(offer.imageUrl, 64);

  return (
    <article className="surface surface-hover relative overflow-hidden">
      {/* Left strip encodes post type */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 z-20 w-[3px] ${postTypeClass[offer.postType]}`}
      />

      <Link
        to="/offers/$offerId"
        params={{ offerId: offer.publicId }}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        aria-label={`${offer.title} — ${offer.category} offer by ${offer.seller}`}
      />

      <div className="pointer-events-none flex h-full flex-col gap-3 p-4 pl-5">
        <div className="flex items-center gap-3 pr-10">
          {image && (
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="44px"
              width={image.width}
              height={image.height}
              alt={`${offer.title} — ${offer.category} offer by ${offer.seller}`}
              loading="lazy"
              decoding="async"
              className="h-11 w-11 shrink-0 rounded-md border border-border object-cover"
              onError={(event) => {
                event.currentTarget.remove();
              }}
            />
          )}

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{offer.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              by <span className="text-foreground/80">{offer.seller}</span>
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {offer.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background ${postTypeClass[offer.postType]}`}
          >
            {POST_TYPES.find((t) => t.value === offer.postType)?.label}
          </span>
          <span className="chip">{offer.category}</span>
          {offer.verified && <span className="chip border-gold/40 text-gold">Verified ✓</span>}
          <span className="chip capitalize">{offer.source}</span>
          {offer.postedAt && (
            <time
              dateTime={offer.postedAt}
              className="ml-auto font-mono text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              {relativeTime(offer.postedAt)}
            </time>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Stars rating={offer.rating} reviews={offer.reviews} />
          <span className="price-tag">{offer.price}</span>
        </div>
      </div>

      <div className="pointer-events-auto absolute top-2 right-2 z-20">
        <FavoriteButton offerId={offer.publicId} />
      </div>
    </article>
  );
}
