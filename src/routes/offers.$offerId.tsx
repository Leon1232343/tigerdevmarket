import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Stars } from "@/components/market/Stars";
import { isExpired, relativeTime } from "@/lib/offer-format";
import { postTypeClass, POST_TYPES, type Offer } from "@/lib/market-data";
import { responsiveOfferImage } from "@/lib/offer-images";
import { fetchOffer } from "@/lib/offers.functions";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { SafetyBox } from "@/components/market/SafetyBox";
import { SITE_URL, breadcrumbJsonLd, socialImageMeta } from "@/lib/site";


export const Route = createFileRoute("/offers/$offerId")({
  loader: async ({ params }): Promise<{ offer: Offer }> => {
    const offer = await fetchOffer({ data: { offerId: params.offerId } });
    if (!offer) throw notFound();
    return { offer };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Could not load this offer.{" "}
      {error instanceof Error ? error.message : "Please try again."}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      This offer no longer exists.
    </div>
  ),

  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/offers/${params.offerId}`;
    const title = loaderData?.offer
      ? `${loaderData.offer.title} — Tiger Market`
      : "Offer — Tiger Market";
    const description =
      loaderData?.offer?.excerpt ?? "View this Roblox development offer on Tiger Market.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...socialImageMeta,
        ...(loaderData?.offer ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        breadcrumbJsonLd([
          { name: "Offers", path: "/" },
          { name: loaderData?.offer?.title ?? "Offer", path: `/offers/${params.offerId}` },
        ]),
      ],
    };
  },
  component: OfferDetailPage,
});

function OfferDetailPage() {
  const { offer } = Route.useLoaderData() as { offer: Offer };
  const hero = responsiveOfferImage(offer.imageUrl, 640, 16 / 9);
  const typeLabel =
    POST_TYPES.find((type) => type.value === offer.postType)?.label ?? offer.postType;


  return (
    <div className="min-h-screen">
      <SiteNav />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs
          items={[
            { label: "Offers", to: "/" },
            { label: offer.category, to: "/" },
            { label: offer.title },
          ]}
        />

        {offer.scamWarning && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive-foreground">
              <span aria-hidden="true">⚠</span> Scam risk warning
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-destructive-foreground/80">
              {offer.scamWarning}
            </p>
          </div>
        )}

        <article className="surface relative mt-6 overflow-hidden">
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 w-1 ${postTypeClass[offer.postType]}`}
          />

          <div className="p-6 pl-7 sm:p-8 sm:pl-9">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip">{typeLabel}</span>
              <span className="chip">{offer.category}</span>
              {offer.verified && <span className="chip border-gold/40 text-gold">Verified ✓</span>}
              <span className="chip capitalize">{offer.source}</span>
              {offer.postedAt && (
                <span className="chip font-mono" suppressHydrationWarning>
                  {isExpired(offer.postedAt) ? "Expired · " : ""}
                  {relativeTime(offer.postedAt)}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl leading-tight font-bold sm:text-3xl">{offer.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-accent"
                >
                  {offer.seller.slice(0, 2).toUpperCase()}
                </span>
                {offer.sellerId ? (
                  <Link to="/seller/$sellerId" params={{ sellerId: offer.sellerId }} className="hover:text-accent underline-offset-4 hover:underline">
                    {offer.seller}
                  </Link>
                ) : (
                  offer.seller
                )}
              </span>
              <Stars rating={offer.rating} reviews={offer.reviews} size="lg" />
              <span className="price-tag ml-auto text-sm">{offer.price}</span>
            </div>

            {hero && (
              <div className="mt-6 overflow-hidden rounded-lg border border-border">
                <img
                  src={hero.src}
                  srcSet={hero.srcSet}
                  sizes="(min-width: 768px) 720px, 100vw"
                  width={hero.width}
                  height={hero.height}
                  alt={offer.title}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.remove();
                  }}
                />
              </div>
            )}


            <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {offer.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
              {offer.source === "discord" ? (
                <a href="#contact" className="btn-accent">
                  <span aria-hidden="true">◈</span> Message on Discord
                </a>
              ) : (
                <a href="#contact" className="btn-accent">
                  Contact Seller
                </a>
              )}
              <a href={offer.originalUrl} className="btn-ghost">
                View original post ↗
              </a>
              <Link
                to="/trade/$offerId"
                params={{ offerId: offer.publicId }}
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:ml-auto"
              >
                Confirm a trade
              </Link>
            </div>

            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Offer ID: {offer.publicId}
            </p>
          </div>
        </article>
        <SafetyBox offer={offer} url={`${SITE_URL}/offers/${offer.publicId}`} />
      </main>

      <SiteFooter />
    </div>
  );
}
