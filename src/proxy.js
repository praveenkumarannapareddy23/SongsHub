import { NextResponse } from "next/server";

/**
 * ─── Landing Gate ───────────────────────────────────────────────────────────
 *
 * Every public app URL (shared song links, /home, /song/...) is redirected to
 * the landing page FIRST. The app opens only after the visitor clicks the
 * "Explore Songs" button, which sets a session cookie that lets subsequent
 * navigation through the app pass the gate.
 *
 * Exemptions (always pass through):
 *   - /admin           → admin dashboard (has its own auth gate)
 *   - /auth            → Firebase email-verification / auth deep links
 *   - API routes, _next internals, static files (handled by the matcher)
 *   - Search engines & social/chat crawlers (WhatsApp, Telegram, Facebook,
 *     Google…) — so link previews and SEO/indexing keep seeing the real page.
 */

const OPEN_PATHS = ["/admin", "/auth"];

const BOT_RE =
  /bot|spider|crawl|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|yandex|duckduckbot|baiduspider|applebot|google-inspectiontool/i;

// Session cookie set by the "Explore Songs" button (see EnterAppButton).
const ENTERED_COOKIE = "yw_entered";

export function proxy(request) {
  return NextResponse.next();
  const { pathname } = request.nextUrl;

  // The landing page itself is never redirected.
  if (pathname === "/") return NextResponse.next();

  // Admin, auth flows and crawlers go straight through.
  if (
    OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    BOT_RE.test(request.headers.get("user-agent") || "")
  ) {
    return NextResponse.next();
  }

  // Already entered the app this session → browse freely.
  if (request.cookies.get(ENTERED_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  // Everything else → landing page, remembering the original destination so
  // "Explore Songs" can drop the visitor exactly where they wanted to go.
  const target = pathname + request.nextUrl.search;
  const landingUrl = new URL("/", request.url);
  landingUrl.searchParams.set("redirect", target);

  const response = NextResponse.redirect(landingUrl);
  // Failsafe: never let a stale entry cookie survive a gated visit.
  response.cookies.delete(ENTERED_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};