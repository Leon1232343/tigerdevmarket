import { Link } from "@tanstack/react-router";
import { postTypeClass, type Offer } from "@/lib/market-data";
import { Stars } from "./Stars";

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article className="surface surface-hover relative overflow-hidden">
      {/* Left strip encodes post type */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] ${postTypeClass[offer.postType]}`}
      />

      <Link
        to="/offers/$offerId"
        params={{ offerId: offer.publicId }}
        className="flex h-full flex-col gap-3 p-4 pl-5"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-elevated text-lg"
          >
            {offer.thumbnail ? "🖼" : "🐯"}
          </span>
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
          <span className="chip">{offer.category}</span>
          {offer.verified && (
            <span className="chip border-gold/40 text-gold">Verified ✓</span>
          )}
          <span className="chip capitalize">{offer.source}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Stars rating={offer.rating} />
          <span className="price-tag">{offer.price}</span>
        </div>
      </Link>
    </article>
  );
}
