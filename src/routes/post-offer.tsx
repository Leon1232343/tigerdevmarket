import { useState } from "react";
import { createFileRoute, Link, useLoaderData, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { createOffer } from "@/lib/post-offer.functions";
import {
  MAX_DESCRIPTION,
  MAX_TITLE,
  OFFER_CATEGORIES,
  OFFER_POST_TYPES,
  PAYMENT_METHODS,
  validatePostOffer,
  type PostOfferInput,
} from "@/lib/post-offer-schema";
import type { SessionUser } from "@/lib/auth.server";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { SITE_URL, breadcrumbJsonLd, socialImageMeta } from "@/lib/site";

export const Route = createFileRoute("/post-offer")({
  head: () => ({
    meta: [
      { title: "Post an offer — Tiger Market" },
      {
        name: "description",
        content:
          "Publish your own Roblox development offer on Tiger Market: scripting, building, UI design, modeling, GFX, animation and more.",
      },
      { property: "og:title", content: "Post an offer — Tiger Market" },
      {
        property: "og:description",
        content:
          "List your Roblox dev service or request on Tiger Market in under a minute — sign in with Discord and publish.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/post-offer" },
      { name: "twitter:card", content: "summary_large_image" },
      ...socialImageMeta,
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/post-offer" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Offers", path: "/" },
        { name: "Post an offer", path: "/post-offer" },
      ]),
    ],
  }),
  component: PostOfferPage,
});

const EMPTY: PostOfferInput = {
  title: "",
  description: "",
  category: "Scripting",
  postType: "Selling",
  priceDisplay: "",
  paymentMethods: [],
  contactUrl: "",
  imageUrl: "",
};

function PostOfferPage() {
  const { user } = useLoaderData({ from: "__root__" }) as { user: SessionUser | null };
  const navigate = useNavigate();
  const submit = useServerFn(createOffer);

  const [form, setForm] = useState<PostOfferInput>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  function set<K extends keyof PostOfferInput>(key: K, value: PostOfferInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePayment(method: string) {
    setForm((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((entry) => entry !== method)
        : [...prev.paymentMethods, method],
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validatePostOffer(form);
    setErrors(found);
    if (found.length > 0) return;

    setPending(true);
    try {
      const result = await submit({ data: form });
      navigate({
        to: "/thank-you",
        search: { kind: "offer", offerId: String(result.offerId) },
      });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Could not publish your offer."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Offers", to: "/" }, { label: "Post an offer" }]} />
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Post your own offer
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Your listing appears in the marketplace immediately and is searchable by every buyer on
          Tiger Market.
        </p>

        {!user ? (
          <section className="surface mt-8 p-6">
            <h2 className="text-base font-semibold">Sign in to continue</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Offers are tied to your Discord account so buyers know who they're dealing with.
            </p>
            <a
              href="/api/auth/discord/login?returnTo=%2Fpost-offer"
              className="btn-accent mt-5"
              rel="nofollow"
            >
              <span aria-hidden="true">◈</span> Continue with Discord
            </a>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="surface mt-8 space-y-6 p-5 sm:p-7">
            {errors.length > 0 && (
              <ul
                role="alert"
                className="space-y-1 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive-foreground"
              >
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}

            <div>
              <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <input
                id="title"
                className="field mt-1.5"
                maxLength={MAX_TITLE}
                placeholder="Experienced scripter for tycoon systems"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="postType" className="text-xs font-medium text-muted-foreground">
                  Post type
                </label>
                <select
                  id="postType"
                  className="field mt-1.5"
                  value={form.postType}
                  onChange={(event) => set("postType", event.target.value)}
                >
                  {OFFER_POST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  id="category"
                  className="field mt-1.5"
                  value={form.category}
                  onChange={(event) => set("category", event.target.value)}
                >
                  {OFFER_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                id="description"
                className="field mt-1.5 h-40 resize-y py-2.5 leading-relaxed"
                maxLength={MAX_DESCRIPTION}
                placeholder="What you offer or need, your experience, timelines, portfolio links…"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                required
              />
              <p className="mt-1 text-right font-mono text-[11px] text-muted-foreground">
                {form.description.length}/{MAX_DESCRIPTION}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="text-xs font-medium text-muted-foreground">
                  Price (optional)
                </label>
                <input
                  id="price"
                  className="field mt-1.5 font-mono"
                  placeholder="R$ 5,000 or $20/hour"
                  value={form.priceDisplay}
                  onChange={(event) => set("priceDisplay", event.target.value)}
                />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Payment methods</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const active = form.paymentMethods.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePayment(method)}
                        className={`chip transition-colors ${
                          active ? "border-accent text-accent" : "hover:text-foreground"
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact" className="text-xs font-medium text-muted-foreground">
                  Contact link (optional)
                </label>
                <input
                  id="contact"
                  type="url"
                  className="field mt-1.5"
                  placeholder="https://discord.gg/… or your portfolio"
                  value={form.contactUrl}
                  onChange={(event) => set("contactUrl", event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="image" className="text-xs font-medium text-muted-foreground">
                  Image link (optional)
                </label>
                <input
                  id="image"
                  type="url"
                  className="field mt-1.5"
                  placeholder="https://…"
                  value={form.imageUrl}
                  onChange={(event) => set("imageUrl", event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <button type="submit" className="btn-accent" disabled={pending}>
                {pending ? "Publishing…" : "Publish offer"}
              </button>
              <Link to="/" className="btn-ghost">
                Cancel
              </Link>
              <p className="text-[11px] text-muted-foreground">
                Posting as{" "}
                <span className="text-foreground">{user.displayName ?? user.username}</span>. Up to
                5 offers per day.
              </p>
            </div>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
