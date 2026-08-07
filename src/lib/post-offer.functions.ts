import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { PostOfferInput } from "@/lib/post-offer-schema";

function str(value: unknown, max: number): string {
  return String(value ?? "")
    .slice(0, max)
    .trim();
}

export const createOffer = createServerFn({ method: "POST" })
  .inputValidator(
    (input: PostOfferInput): PostOfferInput => ({
      title: str(input?.title, 200),
      description: str(input?.description, 8000),
      category: str(input?.category, 60),
      postType: str(input?.postType, 40),
      priceDisplay: str(input?.priceDisplay, 60),
      paymentMethods: Array.isArray(input?.paymentMethods)
        ? input.paymentMethods.slice(0, 5).map((method) => str(method, 40))
        : [],
      contactUrl: str(input?.contactUrl, 400),
      imageUrl: str(input?.imageUrl, 400),
    }),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) throw new Error("You must be signed in to post an offer.");

    const { SESSION_COOKIE, readCookie, getUserBySessionToken } = await import(
      "@/lib/auth.server"
    );
    const token = readCookie(request, SESSION_COOKIE);
    const user = token ? await getUserBySessionToken(token) : null;
    if (!user) throw new Error("You must be signed in with Discord to post an offer.");

    const { createWebsiteOffer } = await import("@/lib/post-offer.server");
    return createWebsiteOffer(user, data);
  });
