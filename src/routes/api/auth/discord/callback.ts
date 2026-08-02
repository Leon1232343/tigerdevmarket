import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  OAUTH_STATE_COOKIE,
  RETURN_TO_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  clearCookie,
  createSession,
  exchangeCodeForToken,
  fetchDiscordUser,
  isSecureRequest,
  logSecurityEvent,
  readCookie,
  safeEqual,
  sanitizeReturnTo,
  serializeCookie,
  upsertDiscordUser,
} from "@/lib/auth.server";

// Discord returns short opaque values; validate before touching them.
const callbackSchema = z.object({
  code: z.string().min(1).max(512),
  state: z.string().min(1).max(512),
});

/**
 * Discord OAuth2 redirect target. Verifies `state`, exchanges the code for an
 * access token server-side, refreshes the stored profile, and issues a
 * persistent HttpOnly session cookie.
 */
export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const secure = isSecureRequest(request);
        const returnTo = sanitizeReturnTo(
          decodeURIComponent(readCookie(request, RETURN_TO_COOKIE) ?? "/"),
        );

        const failure = (reason: string) => {
          const headers = new Headers({ Location: `/login?error=1` });
          headers.append("Set-Cookie", clearCookie(OAUTH_STATE_COOKIE, secure));
          headers.append("Set-Cookie", clearCookie(RETURN_TO_COOKIE, secure));
          void logSecurityEvent("login_failed", reason, request);
          return new Response(null, { status: 302, headers });
        };

        // The user denied consent, or Discord reported an error.
        if (url.searchParams.get("error")) return failure("provider_error");

        const parsed = callbackSchema.safeParse({
          code: url.searchParams.get("code") ?? "",
          state: url.searchParams.get("state") ?? "",
        });
        if (!parsed.success) return failure("invalid_callback_params");

        const expectedState = readCookie(request, OAUTH_STATE_COOKIE);
        if (!expectedState || !safeEqual(expectedState, parsed.data.state)) {
          return failure("state_mismatch");
        }

        try {
          const accessToken = await exchangeCodeForToken(request, parsed.data.code);
          const discordUser = await fetchDiscordUser(accessToken);
          const userId = await upsertDiscordUser(discordUser);
          const { token } = await createSession(userId, request);

          await logSecurityEvent("login_success", "discord_oauth2", request, userId);

          const headers = new Headers({ Location: returnTo });
          headers.append(
            "Set-Cookie",
            serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_MAX_AGE, secure }),
          );
          headers.append("Set-Cookie", clearCookie(OAUTH_STATE_COOKIE, secure));
          headers.append("Set-Cookie", clearCookie(RETURN_TO_COOKIE, secure));
          return new Response(null, { status: 302, headers });
        } catch (error) {
          // Log internally, return a generic outcome to the browser.
          console.error("[auth] discord callback failed", error);
          return failure("exchange_failed");
        }
      },
    },
  },
});
