/**
 * Owner-only server gate for /admin and every admin server function.
 *
 * The owner is whoever's Discord ID is configured, never a value the browser
 * sends. `OWNER_ID` matches the Discord bot's variable name, so the same ID is
 * reused across both; `OWNER_DISCORD_IDS` allows a short comma list.
 */
import type { SessionUser } from "./auth.server";

export function ownerDiscordIds(): string[] {
  const raw = [
    process.env["OWNER_DISCORD_ID"],
    process.env["OWNER_ID"],
    process.env["OWNER_DISCORD_IDS"],
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(",");

  return raw
    .split(/[,\s;]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d{5,25}$/.test(value));
}

export function isOwner(user: SessionUser | null): boolean {
  if (!user) return false;
  return ownerDiscordIds().includes(user.discordId);
}

/** Throws for everyone except the configured owner. */
export async function requireOwner(): Promise<SessionUser> {
  const { requireSessionUser } = await import("./session-user.server");
  const user = await requireSessionUser();
  if (!isOwner(user)) throw new Error("Not found.");
  return user;
}
