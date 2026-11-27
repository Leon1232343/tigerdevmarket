import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { MAX_AD_DESCRIPTION, MAX_AD_TITLE } from "@/lib/ads";
import { AD_SLOTS, adSlotById, discountedEur, euro, type AdSlotId } from "@/lib/ad-slots";
import { DiscordButton } from "@/components/market/DiscordButton";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise on Tiger Market — reach Roblox developers" },
      {
        name: "description",
        content:
          "Sponsored cards on the Tiger Market offer grid. Category targeting, a click budget and a 24h unique-click rule — pay per counted click, not per impression.",
      },
      { property: "og:title", content: "Advertise on Tiger Market" },
      {
        property: "og:description",
        content:
          "Put your tool, server or service in front of Roblox developers browsing live offers. Sponsored cards, category targeting, pay per click.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/advertise` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/advertise` }],
  }),
  // Payment links are read on the server: the URLs are public, the env vars are not.
  loader: async () => {
    const { adSlotPaymentLinks } = await import("@/lib/ad-slots.server");
    return { payments: adSlotPaymentLinks() };
  },
  component: AdvertisePage,
});

const PLACEMENTS = [
  {
    title: "Browse grid card",
    body: "A labelled card inside the offer results on the homepage — the first screen buyers see after the category tiles.",
    tag: "Homepage · /#offers",
  },
  {
    title: "Category targeting",
    body: "Target only the categories you care about — scripting, building, UI, 3D, GFX, animation, VFX or audio — or run everywhere.",
    tag: "Targeting",
  },
  {
    title: "Click budget",
    body: "Set a maximum number of counted clicks. Once the budget is spent the card stops showing; no surprise invoices.",
    tag: "Budget · expiry",
  },
];

const SPECS: { label: string; value: string }[] = [
  { label: "Title", value: `${MAX_AD_TITLE} characters, no emoji spam` },
  { label: "Description", value: `${MAX_AD_DESCRIPTION} characters, plain text` },
  { label: "Media", value: "https image, 1200 × 630 recommended (optional)" },
  { label: "Target URL", value: "https:// only — no redirects of your own" },
  { label: "Label", value: "Always “Sponsored”, required by EU ad rules" },
];

function AdvertisePage() {
  const { payments } = Route.useLoaderData();
  const [selected, setSelected] = useState<AdSlotId>("starter");
  const selectedSlot = adSlotById(selected);
  const selectedLinks = payments[selectedSlot.id];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Advertise" }]} />

        <section className="mt-6">
          <p className="chip">Sponsored placements</p>
          <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-bold sm:text-5xl">
            Put your product in front of Roblox developers.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Tiger Market is where developers look for work and studios look for talent. A sponsored
            card sits inside that browse flow — clearly labelled, category-targeted and billed per
            counted click.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="#slots" className="btn-accent">
              Choose a slot
            </a>
            <Link to="/" className="btn-ghost">
              See the marketplace
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Where your card runs</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PLACEMENTS.map((placement) => (
              <article key={placement.title} className="surface p-4">
                <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                  {placement.tag}
                </p>
                <h3 className="mt-2 text-sm font-semibold">{placement.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {placement.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="surface p-5">
            <h2 className="text-lg font-semibold">How billing works</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Impressions are free — you only pay for counted clicks.</li>
              <li>
                A click counts once per person per 24 hours, so refreshing or double-clicking is not
                billed.
              </li>
              <li>
                Each click is tracked through a Tiger Market link before the visitor lands on your
                page.
              </li>
              <li>Pause a campaign any time; unspent budget stays on the account.</li>
            </ul>
          </div>

          <div className="surface p-5">
            <h2 className="text-lg font-semibold">What we accept</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Tools, assets, servers and services for Roblox developers.</li>
              <li>No scam offers, malware, gambling or adult content.</li>
              <li>No ads that impersonate Tiger Market or hide that they are advertising.</li>
              <li>
                We pause anything that breaks these rules — no refund for the paused remainder.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Creative specs</h2>
          <div className="surface mt-4 overflow-hidden">
            <table className="w-full text-left text-xs">
              <tbody>
                {SPECS.map((spec) => (
                  <tr key={spec.label} className="border-b border-border last:border-0">
                    <th scope="row" className="w-32 px-4 py-3 font-medium text-foreground">
                      {spec.label}
                    </th>
                    <td className="px-4 py-3 text-muted-foreground">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Every card carries the “Sponsored” label and an <code>rel="sponsored"</code> link.
          </p>
        </section>

        <section className="mt-12" id="slots">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-semibold">Choose your slot</h2>
            <span className="chip border-gold/40 text-gold">First 3 advertisers: 50% off</span>
          </div>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Pick one of the slots below, then pay with crypto or PayPal. Crypto is confirmed
            automatically; for PayPal send the transaction id in a ticket, because a personal
            account gives us no automatic confirmation.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Ad slots">
            {AD_SLOTS.map((slot) => {
              const active = slot.id === selected;
              return (
                <div
                  key={slot.id}
                  role="radio"
                  aria-checked={active}
                  tabIndex={0}
                  onClick={() => setSelected(slot.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(slot.id);
                    }
                  }}
                  className={cn(
                    "surface flex cursor-pointer flex-col gap-3 p-5 transition-colors",
                    active ? "border-gold ring-1 ring-gold/40" : "hover:border-foreground/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        <span aria-hidden="true">{slot.emoji}</span> {slot.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {slot.blurb}
                      </p>
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block font-display text-xl font-semibold">
                        {euro(slot.priceEur)}
                      </span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        first 3: {euro(discountedEur(slot.priceEur))}
                      </span>
                    </p>
                  </div>

                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {slot.features.map((feature) => (
                      <li key={feature}>· {feature}</li>
                    ))}
                  </ul>

                  <span
                    className={cn(
                      "chip mt-auto w-fit",
                      active ? "border-gold/40 text-gold" : "text-muted-foreground",
                    )}
                  >
                    {active ? "Selected" : "Select"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="surface mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="chip">Your selection</p>
              <h3 className="mt-2 text-sm font-semibold">
                <span aria-hidden="true">{selectedSlot.emoji}</span> {selectedSlot.name} —{" "}
                {euro(selectedSlot.priceEur)}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedSlot.blurb} First 3 advertisers pay{" "}
                {euro(discountedEur(selectedSlot.priceEur))}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedLinks.crypto ? (
                <a
                  href={selectedLinks.crypto}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="btn-accent text-xs"
                >
                  Buy {selectedSlot.name} with crypto
                </a>
              ) : (
                <DiscordButton label="Buy via ticket" className="btn-accent text-xs" />
              )}
              {selectedLinks.paypal && (
                <a
                  href={selectedLinks.paypal}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="btn-ghost text-xs"
                >
                  PayPal
                </a>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Every slot includes the required “Sponsored” label. We set your campaign live once the
            payment is confirmed — usually within a few hours.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
