import { createFileRoute } from "@tanstack/react-router";
import {
  OAUTH_STATE_COOKIE,
  RETURN_TO_COOKIE,
  STATE_MAX_AGE,
  buildAuthorizeUrl,
  isDiscordConfigured,
  isSecureRequest,
  randomToken,
  sanitizeReturnTo,
  serializeCookie,
} from "@/lib/auth.server";

/**
 * Starts the Discord OAuth2 flow. Generates a CSRF `state` value, stores it in
 * a short-lived HttpOnly cookie (double-submit), and redirects to Discord.
 */
export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isDiscordConfigured()) {
          return new Response("Discord login is not configured yet.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        const state = randomToken();
        const secure = isSecureRequest(request);
        const returnTo = sanitizeReturnTo(new URL(request.url).searchParams.get("returnTo"));

        const headers = new Headers({ Location: buildAuthorizeUrl(request, state) });
        headers.append(
          "Set-Cookie",
          serializeCookie(OAUTH_STATE_COOKIE, state, { maxAge: STATE_MAX_AGE, secure }),
        );
        headers.append(
          "Set-Cookie",
          serializeCookie(RETURN_TO_COOKIE, encodeURIComponent(returnTo), {
            maxAge: STATE_MAX_AGE,
            secure,
          }),
        );

        return new Response(null, { status: 302, headers });
      },
    },
  },
});
