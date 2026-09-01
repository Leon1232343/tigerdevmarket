import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { breadcrumbJsonLd } from "@/lib/site";

type ThankYouKind = "offer" | "trade";

const COPY: Record<ThankYouKind, { heading: string; body: string }> = {
  offer: {
    heading: "Your offer is live",
    body: "Thanks for posting on Tiger Market. Your listing is now searchable by every buyer on the marketplace.",
  },
  trade: {
    heading: "Thanks for confirming",
    body: "Your trade confirmation was recorded. Once both parties confirm, it counts toward seller reputation.",
  },
};

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>) => ({
    kind: search["kind"] === "trade" ? ("trade" as const) : ("offer" as const),
    offerId: typeof search["offerId"] === "string" ? search["offerId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thank you — Tiger Market" },
      {
        name: "description",
        content:
          "Confirmation page for completed actions on Tiger Market — posted offers and confirmed trades.",
      },
      { property: "og:title", content: "Thank you — Tiger Market" },
      {
        property: "og:description",
        content: "Your Tiger Market action was completed successfully.",
      },
      { name: "robots", content: "noindex" },
    ],
    scripts: [breadcrumbJsonLd([{ name: "Offers", path: "/" }, { name: "Thank you", path: "/thank-you" }])],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const { kind, offerId } = Route.useSearch();
  const copy = COPY[kind as ThankYouKind];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <Breadcrumbs items={[{ label: "Offers", to: "/" }, { label: "Thank you" }]} />

        <section className="surface mt-6 p-6 text-center sm:p-9">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-xl text-accent"
          >
            ✓
          </span>
          <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight">
            {copy.heading}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {copy.body}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {offerId && (
              <Link to="/offers/$offerId" params={{ offerId }} className="btn-accent">
                View your listing
              </Link>
            )}
            <Link to="/" className="btn-ghost">
              Browse offers
            </Link>
            <Link to="/post-offer" className="btn-ghost">
              Post another offer
            </Link>
          </div>
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link to="/" className="surface surface-hover p-4 text-sm">
            All offers
            <span className="mt-1 block text-xs text-muted-foreground">
              Scripting, building, GFX and more
            </span>
          </Link>
          <Link to="/terms-of-use" className="surface surface-hover p-4 text-sm">
            Terms of Use
            <span className="mt-1 block text-xs text-muted-foreground">Rules for trading here</span>
          </Link>
          <Link to="/cookie-policy" className="surface surface-hover p-4 text-sm">
            Cookie Policy
            <span className="mt-1 block text-xs text-muted-foreground">How we use cookies</span>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
