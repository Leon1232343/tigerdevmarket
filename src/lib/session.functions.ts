import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Reads the signed-in user from the HttpOnly session cookie. Safe to call from
 * public loaders: it returns null instead of throwing when there is no session.
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
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
});
