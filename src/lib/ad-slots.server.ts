/**
 * Payment links for the ad slots on /advertise.
 *
 * Crypto runs through Atlos, whose payment links carry a fixed amount, so each
 * slot needs its own URL. PayPal links are built from one base URL because
 * paypal.me takes the amount as the last path segment.
 */
import { AD_SLOTS, type AdSlotId } from "./ad-slots";

export type AdSlotPayLinks = { crypto: string | null; paypal: string | null };

const CRYPTO_ENV: Record<AdSlotId, string> = {
  starter: "AD_CRYPTO_URL_STARTER",
  targeted: "AD_CRYPTO_URL_TARGETED",
  launch: "AD_CRYPTO_URL_LAUNCH",
  boost: "AD_CRYPTO_URL_BOOST",
};

function httpsOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * paypal.me encodes the amount as the final path segment
 * (https://www.paypal.me/TiegerDevMarket/2.50EUR), so an existing amount is
 * replaced rather than appended.
 */
export function paypalUrlFor(amountEur: number, raw: string | null): string | null {
  const base = httpsOnly(raw);
  if (!base) return null;

  const url = new URL(base);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const amount = `${Number.isInteger(amountEur) ? amountEur : amountEur.toFixed(2)}EUR`;
  const last = segments[segments.length - 1] ?? "";
  if (/^[\d.]+[A-Z]{3}$/.test(last)) segments[segments.length - 1] = amount;
  else segments.push(amount);

  url.pathname = `/${segments.join("/")}`;
  return url.toString();
}

export function adSlotPaymentLinks(): Record<AdSlotId, AdSlotPayLinks> {
  const paypalBase = process.env["AD_PAYPAL_URL"] ?? process.env["BOOST_PAYPAL_URL"] ?? null;

  const links = {} as Record<AdSlotId, AdSlotPayLinks>;
  for (const slot of AD_SLOTS) {
    links[slot.id] = {
      crypto: httpsOnly(process.env[CRYPTO_ENV[slot.id]]),
      paypal: paypalUrlFor(slot.priceEur, paypalBase),
    };
  }
  return links;
}
