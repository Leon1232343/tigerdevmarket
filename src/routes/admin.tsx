import { useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { adStatus, adStatusLabel, adHref } from "@/lib/ads";
import { relativeTime } from "@/lib/offer-format";
import {
  adminBoostSeller,
  adminCreateAd,
  adminDeleteAd,
  adminPinOffer,
  adminRemoveBoost,
  adminSetAdActive,
  fetchAdminData,
} from "@/lib/admin.functions";

/**
 * /admin — owner only. The gate is the loader: a signed-in non-owner gets a 404
 * before any data is read, and every mutation re-checks the owner server-side.
 */
export const Route = createFileRoute("/admin")({
  loader: async () => {
    const result = await fetchAdminData();
    // Signed-in non-owners get the normal 404, so /admin does not reveal itself.
    if (result.status === "denied") throw notFound();
    return result;
  },
  head: () => ({
    meta: [
      { title: "Admin — Tiger Market" },
      { name: "robots", content: "noindex" },
      { name: "robots", content: "nofollow" },
    ],
  }),
  component: AdminPage,
});

const EMPTY_FORM = {
  advertiser: "",
  title: "",
  description: "",
  targetUrl: "",
  categories: "",
  maxClicks: "0",
  expiresAt: "",
  mediaUrl: "",
};

function AdminPage() {
  const result = Route.useLoaderData();
  const router = useRouter();
  const createAd = useServerFn(adminCreateAd);
  const setActive = useServerFn(adminSetAdActive);
  const removeAd = useServerFn(adminDeleteAd);
  const pinOffer = useServerFn(adminPinOffer);
  const boostSeller = useServerFn(adminBoostSeller);
  const removeBoost = useServerFn(adminRemoveBoost);

  const [form, setForm] = useState(EMPTY_FORM);
  const [offerDraft, setOfferDraft] = useState("");
  const [boostDraft, setBoostDraft] = useState({ sellerId: "", days: "14" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (result.status !== "ok") {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNav />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <section className="surface mt-6 p-6">
            <h2 className="text-base font-semibold">Sign in as the owner</h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
              This area is limited to the Tiger Market owner account. Sign in with the Discord
              account whose ID is configured as the owner.
            </p>
            <a
              href="/api/auth/discord/login?returnTo=%2Fadmin"
              rel="nofollow"
              className="btn-accent mt-5"
            >
              <span aria-hidden="true">◈</span> Continue with Discord
            </a>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      await router.invalidate();
      setMessage(done);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  const { data } = result;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Admin</h1>
          <Link to="/advertise" className="text-xs text-muted-foreground hover:text-foreground">
            Public advertising page ↗
          </Link>
        </div>

        {message && (
          <p role="status" className="mt-4 text-xs text-accent">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-xs text-destructive-foreground">
            {error}
          </p>
        )}

        {/* Ads */}
        <section className="mt-8" aria-labelledby="admin-ads">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="admin-ads" className="text-lg font-semibold">
              Ads
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {data.ads.length} campaign{data.ads.length === 1 ? "" : "s"}
            </p>
          </div>

          {data.ads.length === 0 ? (
            <p className="surface mt-3 p-4 text-xs text-muted-foreground">
              No campaigns yet. The first one you create appears in the browse grid right away.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.ads.map((ad) => {
                const status = adStatus(ad, ad.clicks);
                return (
                  <li key={ad.id} className="surface flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        <span className="mr-2 font-mono text-[11px] text-muted-foreground">
                          #{ad.id}
                        </span>
                        {ad.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {ad.advertiser}
                        {ad.categories.length > 0
                          ? ` · ${ad.categories.join(", ")}`
                          : " · all categories"}
                        {ad.expiresAt ? ` · ends ${relativeTime(ad.expiresAt)}` : ""}
                      </p>
                    </div>

                    <span
                      className={`chip ${
                        status === "active"
                          ? "border-accent/50 text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      {adStatusLabel(status)}
                    </span>

                    <span className="font-mono text-[11px] text-muted-foreground">
                      {ad.impressions} imp · {ad.clicks} clicks ({ad.uniqueClicks} unique)
                      {ad.maxClicks > 0 ? ` / ${ad.maxClicks}` : ""}
                    </span>

                    <a
                      href={adHref(ad.id)}
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      rel="nofollow"
                    >
                      /go/{ad.id}
                    </a>

                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => setActive({ data: { id: ad.id, active: !ad.active } }),
                          ad.active ? "Campaign paused." : "Campaign resumed.",
                        )
                      }
                    >
                      {ad.active ? "Pause" : "Resume"}
                    </button>

                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`Delete ad #${ad.id} and its click history?`)) return;
                        void run(() => removeAd({ data: { id: ad.id } }), "Campaign deleted.");
                      }}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            className="surface mt-4 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await createAd({
                  data: {
                    ...form,
                    maxClicks: Number(form.maxClicks) || 0,
                  },
                });
                setForm(EMPTY_FORM);
              }, "Campaign created.");
            }}
          >
            <h3 className="text-sm font-semibold">New campaign</h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">Advertiser</span>
                <input
                  className="field"
                  value={form.advertiser}
                  maxLength={80}
                  required
                  placeholder="Studio or product name"
                  onChange={(event) => setForm({ ...form, advertiser: event.target.value })}
                />
              </label>

              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">Title</span>
                <input
                  className="field"
                  value={form.title}
                  maxLength={60}
                  required
                  placeholder="Build faster with …"
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </label>

              <label className="text-xs sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Description</span>
                <textarea
                  className="field min-h-20"
                  value={form.description}
                  maxLength={200}
                  placeholder="One or two sentences for the card."
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </label>

              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">Target URL</span>
                <input
                  className="field"
                  type="url"
                  value={form.targetUrl}
                  required
                  placeholder="https://example.com"
                  onChange={(event) => setForm({ ...form, targetUrl: event.target.value })}
                />
              </label>

              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">
                  Categories (comma list, empty = everywhere)
                </span>
                <input
                  className="field"
                  value={form.categories}
                  placeholder="Scripting, Building"
                  onChange={(event) => setForm({ ...form, categories: event.target.value })}
                />
              </label>

              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">
                  Click budget (0 = unlimited)
                </span>
                <input
                  className="field font-mono"
                  inputMode="numeric"
                  value={form.maxClicks}
                  onChange={(event) =>
                    setForm({ ...form, maxClicks: event.target.value.replace(/[^\d]/g, "") })
                  }
                />
              </label>

              <label className="text-xs">
                <span className="mb-1 block text-muted-foreground">Ends (optional)</span>
                <input
                  className="field"
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                />
              </label>

              <label className="text-xs sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">Image URL (optional)</span>
                <input
                  className="field"
                  type="url"
                  value={form.mediaUrl}
                  placeholder="https://…/banner.png"
                  onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })}
                />
              </label>
            </div>

            <button type="submit" className="btn-accent mt-4" disabled={busy}>
              Create campaign
            </button>
          </form>
        </section>

        {/* Featured */}
        <section className="mt-10" aria-labelledby="admin-featured">
          <h2 id="admin-featured" className="text-lg font-semibold">
            Featured offers
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pinned offers sort to the top of the default “newest” listing and carry a Featured
            badge.
          </p>

          <form
            className="surface mt-3 flex flex-wrap items-end gap-2 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const offerId = Number(offerDraft);
              if (!Number.isInteger(offerId) || offerId <= 0) {
                setError("Enter a numeric offer ID.");
                return;
              }
              void run(() => pinOffer({ data: { offerId, pinned: true } }), "Offer pinned.");
              setOfferDraft("");
            }}
          >
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Offer ID</span>
              <input
                className="field font-mono"
                inputMode="numeric"
                value={offerDraft}
                placeholder="123456"
                onChange={(event) => setOfferDraft(event.target.value.replace(/[^\d]/g, ""))}
              />
            </label>
            <button type="submit" className="btn-accent" disabled={busy}>
              Pin offer
            </button>
          </form>

          {data.pinned.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Nothing pinned right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.pinned.map((offer) => (
                <li key={offer.offerId} className="surface flex flex-wrap items-center gap-3 p-3">
                  <Link
                    to="/offers/$offerId"
                    params={{ offerId: String(offer.offerId) }}
                    className="min-w-0 flex-1 truncate text-sm hover:text-accent"
                  >
                    #{offer.offerId} · {offer.seller}
                  </Link>
                  {offer.pinnedAt && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {relativeTime(offer.pinnedAt)}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => pinOffer({ data: { offerId: offer.offerId, pinned: false } }),
                        "Offer unpinned.",
                      )
                    }
                  >
                    Unpin
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Boosts */}
        <section className="mt-10" aria-labelledby="admin-boosts">
          <h2 id="admin-boosts" className="text-lg font-semibold">
            Seller boosts
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A boost marks every offer of that seller as Boosted and sorts them above regular
            listings for the chosen number of days.
          </p>

          <form
            className="surface mt-3 flex flex-wrap items-end gap-2 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () =>
                  boostSeller({
                    data: {
                      sellerId: boostDraft.sellerId,
                      days: Number(boostDraft.days) || 1,
                    },
                  }),
                "Seller boosted.",
              );
              setBoostDraft({ sellerId: "", days: "14" });
            }}
          >
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Seller Discord ID</span>
              <input
                className="field font-mono"
                value={boostDraft.sellerId}
                required
                placeholder="123456789012345678"
                onChange={(event) =>
                  setBoostDraft({
                    ...boostDraft,
                    sellerId: event.target.value.replace(/[^\d]/g, ""),
                  })
                }
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block text-muted-foreground">Days</span>
              <input
                className="field w-24 font-mono"
                inputMode="numeric"
                value={boostDraft.days}
                onChange={(event) =>
                  setBoostDraft({
                    ...boostDraft,
                    days: event.target.value.replace(/[^\d]/g, ""),
                  })
                }
              />
            </label>
            <button type="submit" className="btn-accent" disabled={busy}>
              Boost seller
            </button>
          </form>

          {data.boosts.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No active boosts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.boosts.map((boost) => (
                <li key={boost.sellerId} className="surface flex flex-wrap items-center gap-3 p-3">
                  <Link
                    to="/seller/$sellerId"
                    params={{ sellerId: boost.sellerId }}
                    className="min-w-0 flex-1 truncate text-sm hover:text-accent"
                  >
                    {boost.username}
                  </Link>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ends {boost.expiresAt ? relativeTime(boost.expiresAt) : "—"}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => removeBoost({ data: { sellerId: boost.sellerId } }),
                        "Boost removed.",
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
