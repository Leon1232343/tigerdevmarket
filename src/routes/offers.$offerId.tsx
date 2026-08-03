import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Stars } from "@/components/market/Stars";
import { postTypeClass, POST_TYPES, type Offer } from "@/lib/market-data";
import { fetchOffer } from "@/lib/offers.functions";

export const Route = createFileRoute("/offers/$offerId")({
  loader: async ({ params }): Promise<{ offer: Offer }> => {
    const offer = await fetchOffer({ data: { offerId: params.offerId } });
    if (!offer) throw notFound();
    return { offer };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Could not load this offer. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      This offer no longer exists.
    </div>
  ),

  head: ({ loaderData }) => {
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
      ],
    };
  },
  component: OfferDetailPage,
});

function OfferDetailPage() {
  const { offer } = Route.useLoaderData() as { offer: Offer };
  const typeLabel =
    POST_TYPES.find((type) => type.value === offer.postType)?.label ?? offer.postType;

  return (
    <div className="min-h-screen">
      <SiteNav />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← Back to offers
        </Link>

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
                {offer.seller}
              </span>
              <Stars rating={offer.rating} reviews={offer.reviews} size="lg" />
              <span className="price-tag ml-auto text-sm">{offer.price}</span>
            </div>

            <div className="mt-6 aspect-[16/7] w-full overflow-hidden rounded-lg border border-border bg-elevated">
              <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
                {offer.thumbnail ? "🖼" : "🐯"}
              </div>
            </div>

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
      </main>

      <SiteFooter />
    </div>
  );
}
