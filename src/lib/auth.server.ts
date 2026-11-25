/**
 * Discord OAuth2 + session management. Server-only: this module reads secrets
 * and uses the service-role database client, so it must never be imported from
 * a route component or any client-reachable module scope.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tm_session";
export const OAUTH_STATE_COOKIE = "tm_oauth_state";
export const RETURN_TO_COOKIE = "tm_return_to";

/** 30 days, in seconds. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const STATE_MAX_AGE = 60 * 10;

const DISCORD_API = "https://discord.com/api/v10";
const DISCORD_AUTHORIZE = "https://discord.com/oauth2/authorize";
const SCOPES = "identify";

export type SessionUser = {
  publicId: string;
  discordId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  roles: string[];
};

/* ------------------------------------------------------------------ cookies */

type CookieOptions = {
  maxAge?: number;
  secure: boolean;
};

/** Builds a hardened Set-Cookie header value: HttpOnly + SameSite=Lax + Path=/. */
export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    // Lax (not Strict) so the cookie survives the redirect back from Discord.
    "SameSite=Lax",
  ];
  if (options.secure) parts.push("Secure");
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

export function clearCookie(name: string, secure: boolean): string {
  return serializeCookie(name, "", { maxAge: 0, secure });
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const pair of header.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    if (pair.slice(0, index).trim() === name) {
      return decodeURIComponent(pair.slice(index + 1).trim());
    }
  }
  return null;
}

/** Cookies are only marked Secure over HTTPS so local http dev still works. */
export function isSecureRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${forwardedHost ?? url.host}`;
}

/* ------------------------------------------------------------------- tokens */

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison for the OAuth state double-submit check. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ------------------------------------------------------------- oauth config */

export function discordConfig() {
  const clientId = process.env["DISCORD_CLIENT_ID"];
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured");
  }
  return { clientId, clientSecret };
}

export function isDiscordConfigured(): boolean {
  return Boolean(process.env["DISCORD_CLIENT_ID"] && process.env["DISCORD_CLIENT_SECRET"]);
}

export function redirectUri(request: Request): string {
  return `${requestOrigin(request)}/api/auth/discord/callback`;
}

export function buildAuthorizeUrl(request: Request, state: string): string {
  const { clientId } = discordConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(request),
    response_type: "code",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
  return `${DISCORD_AUTHORIZE}?${params.toString()}`;
}

export { STATE_MAX_AGE, DISCORD_API };

/* -------------------------------------------------------------- discord api */

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  banner?: string | null;
};

export async function exchangeCodeForToken(request: Request, code: string): Promise<string> {
  const { clientId, clientSecret } = discordConfig();
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(request),
    }),
  });

  if (!response.ok) {
    // Never surface the provider body — it can echo the client secret context.
    throw new Error("Discord token exchange failed");
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("Discord token exchange returned no token");
  return payload.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Could not read the Discord profile");
  return (await response.json()) as DiscordUser;
}

function avatarUrl(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
}

function bannerUrl(user: DiscordUser): string | null {
  if (!user.banner) return null;
  const ext = user.banner.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${ext}?size=600`;
}

/* -------------------------------------------------------------- persistence */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function logSecurityEvent(
  eventType: string,
  detail: string,
  request: Request,
  userId?: string | null,
) {
  try {
    const db = await admin();
    await db.from("security_events").insert({
      event_type: eventType,
      detail,
      user_id: userId ?? null,
      ip_address: clientIp(request),
      user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
    });
  } catch (error) {
    console.error("[security] failed to record event", eventType, error);
  }
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("cf-connecting-ip");
}

/** Upserts the Discord profile — user data is refreshed on every login. */
export async function upsertDiscordUser(discordUser: DiscordUser): Promise<string> {
  const db = await admin();
  const { data, error } = await db
    .from("users")
    .upsert(
      {
        discord_id: discordUser.id,
        username: discordUser.username,
        display_name: discordUser.global_name ?? null,
        avatar_url: avatarUrl(discordUser),
        banner_url: bannerUrl(discordUser),
        last_login_at: new Date().toISOString(),
      },
      { onConflict: "discord_id" },
    )
    .select("id")
    .single();

  if (error || !data) throw new Error("Could not save the user record");

  // Every account starts with the baseline role; elevated roles are granted
  // server-side only and are never derived from the OAuth payload.
  await db.from("user_roles").upsert({ user_id: data.id, role: "user" }, { onConflict: "user_id,role" });

  return data.id;
}

export async function createSession(
  userId: string,
  request: Request,
): Promise<{ token: string; expiresAt: Date }> {
  const db = await admin();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  const { error } = await db.from("sessions").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
    ip_address: clientIp(request),
    user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
  });
  if (error) throw new Error("Could not start the session");

  // Opportunistic cleanup of this user's expired sessions.
  await db.from("sessions").delete().lt("expires_at", new Date().toISOString()).eq("user_id", userId);

  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("sessions")
    .delete()
    .eq("token_hash", hashToken(token))
    .select("user_id")
    .maybeSingle();
  return data?.user_id ?? null;
}

/** Resolves a raw session token to the signed-in user, or null when invalid. */
export async function getUserBySessionToken(token: string): Promise<SessionUser | null> {
  const db = await admin();
  const { data, error } = await db
    .from("sessions")
    .select(
      "id, expires_at, users!inner(id, public_id, discord_id, username, display_name, avatar_url, banner_url)",
    )
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await db.from("sessions").delete().eq("id", data.id);
    return null;
  }

  const user = data.users;
  const { data: roleRows } = await db.from("user_roles").select("role").eq("user_id", user.id);

  return {
    publicId: user.public_id,
    discordId: user.discord_id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bannerUrl: user.banner_url,
    roles: (roleRows ?? []).map((row) => row.role),
  };
}

/** Only same-origin relative paths may be used as post-login redirects. */
export function sanitizeReturnTo(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  // Browsers treat `\\` as `/` when resolving a URL, so `/\\evil.example` and
  // its encoded spellings leave the origin. Control characters are stripped by
  // the URL parser before resolution, which can turn `/\t/evil` into `//evil`.
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return "/";
  return value;
}
