import { adHref, type Ad } from "@/lib/ads";

/**
 * A paid placement in the offer grid. Deliberately styled differently from
 * OfferCard and always labelled "Sponsored" so it cannot be mistaken for an
 * organic listing.
 */
export function SponsoredCard({ ad }: { ad: Ad }) {
  const href = adHref(ad.id);

  return (
    <article className="relative overflow-hidden rounded-lg border border-dashed border-gold/50 bg-elevated/40">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-gold/70" />

      <a
        href={href}
        rel="sponsored nofollow noopener"
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        aria-label={`Sponsored: ${ad.title} by ${ad.advertiser}`}
      />

      <div className="pointer-events-none flex h-full flex-col gap-3 p-4 pl-5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gold uppercase">
            Sponsored
          </span>
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {ad.advertiser}
          </span>
        </div>

        {ad.mediaUrl && (
          <img
            src={ad.mediaUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-24 w-full rounded-md border border-border object-cover"
            onError={(event) => {
              event.currentTarget.remove();
            }}
          />
        )}

        <h3 className="text-sm font-semibold">{ad.title}</h3>

        {ad.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {ad.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
          <span className="text-muted-foreground">Advertisement</span>
          <span className="font-medium text-gold">Visit →</span>
        </div>
      </div>
    </article>
  );
}
