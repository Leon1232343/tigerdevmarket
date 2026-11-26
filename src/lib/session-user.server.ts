/**
 * Session helpers for server functions. Server-only: reads the HttpOnly cookie
 * and resolves it against the sessions table.
 */
import type { SessionUser } from "./auth.server";

export async function optionalSessionUser(): Promise<SessionUser | null> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  if (!request) return null;

  const { SESSION_COOKIE, readCookie, getUserBySessionToken } = await import("./auth.server");
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  try {
    return await getUserBySessionToken(token);
  } catch (error) {
    console.error("[auth] session lookup failed", error);
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await optionalSessionUser();
  if (!user) throw new Error("You must be signed in with Discord to do that.");
  return user;
}
