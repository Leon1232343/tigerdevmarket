import { createFileRoute } from "@tanstack/react-router";
import {
  SESSION_COOKIE,
  clearCookie,
  destroySession,
  isSecureRequest,
  logSecurityEvent,
  readCookie,
  requestOrigin,
  sanitizeReturnTo,
} from "@/lib/auth.server";

/**
 * Logout. POST-only so a stray GET (image tag, prefetch) can't sign a user out,
 * and Origin-checked to block cross-site form submissions.
 */
export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secure = isSecureRequest(request);
        const origin = request.headers.get("origin");

        if (origin && origin !== requestOrigin(request)) {
          await logSecurityEvent("logout_rejected", "cross_origin", request);
          return new Response("Forbidden", { status: 403 });
        }

        const token = readCookie(request, SESSION_COOKIE);
        if (token) {
          const userId = await destroySession(token);
          await logSecurityEvent("logout", "session_revoked", request, userId);
        }

        const form = await request.formData().catch(() => null);
        const returnTo = sanitizeReturnTo(
          typeof form?.get("returnTo") === "string" ? (form.get("returnTo") as string) : "/",
        );

        const headers = new Headers({ Location: returnTo });
        headers.append("Set-Cookie", clearCookie(SESSION_COOKIE, secure));
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
