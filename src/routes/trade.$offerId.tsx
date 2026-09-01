import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { type Offer } from "@/lib/market-data";
import { fetchOffer } from "@/lib/offers.functions";

export const Route = createFileRoute("/trade/$offerId")({
  loader: async ({ params }): Promise<{ offer: Offer }> => {
    const offer = await fetchOffer({ data: { offerId: params.offerId } });
    if (!offer) throw notFound();
    return { offer };
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center text-sm">
      Could not load this trade. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm">Offer not found.</div>
  ),

  head: () => ({
    meta: [
      { title: "Confirm trade — Tiger Market" },
      {
        name: "description",
        content:
          "Confirm that a Tiger Market trade took place. Both parties must confirm before the trade counts toward seller reputation.",
      },
      { property: "og:title", content: "Confirm trade — Tiger Market" },
      {
        property: "og:description",
        content: "Both parties confirm a completed Tiger Market trade here.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TradeConfirmationPage,
});

function TradeConfirmationPage() {
  const { offer } = Route.useLoaderData() as { offer: Offer };
  const [confirmed, setConfirmed] = useState(false);
  const counterpartyConfirmed = true; // stands in for the stored confirmation record

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="surface w-full max-w-md p-6 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true">🐯</span> Tiger Market
        </p>
        <h1 className="mt-4 text-xl font-semibold">Confirm this trade</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Both parties must confirm before it counts toward reputation.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-elevated p-4">
          <p className="text-sm font-medium">{offer.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            with <span className="text-foreground/80">{offer.seller}</span> · {offer.category}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">#{offer.publicId}</span>
            <span className="price-tag">{offer.price}</span>
          </div>
        </div>

        <dl className="mt-4 flex items-center justify-between text-xs">
          <dt className="text-muted-foreground">Signed in as</dt>
          <dd className="font-medium">tigerdev</dd>
        </dl>

        <button
          type="button"
          className="btn-accent mt-6 w-full disabled:opacity-60"
          disabled={confirmed}
          onClick={() => setConfirmed(true)}
        >
          {confirmed ? "You confirmed ✓" : "Confirm this trade happened"}
        </button>

        <p
          aria-live="polite"
          className={`mt-3 text-center text-xs ${
            confirmed && counterpartyConfirmed ? "text-gold" : "text-muted-foreground"
          }`}
        >
          {confirmed && counterpartyConfirmed
            ? "Both confirmed ✓ — trade recorded"
            : confirmed
              ? "Waiting on the other party…"
              : "The other party has already confirmed."}
        </p>

        {confirmed && counterpartyConfirmed && (
          <Link
            to="/thank-you"
            search={{ kind: "trade", offerId: offer.publicId }}
            className="btn-ghost mt-6 w-full justify-center"
          >
            Continue
          </Link>
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link
            to="/offers/$offerId"
            params={{ offerId: offer.publicId }}
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to offer
          </Link>
          <Link
            to="/"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Browse offers
          </Link>
        </div>
      </section>
    </main>
  );
}
