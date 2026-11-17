import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { config as appConfig } from "@/lib/config";

/**
 * Guard ringan: hanya memeriksa keberadaan cookie session.
 * Otorisasi sebenarnya dilakukan di server (layout & route handler) —
 * middleware TIDAK boleh dijadikan satu-satunya lapisan keamanan.
 */

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/health"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(appConfig.session.cookieName)?.value);

  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", messageKey: "error.unauthenticated" } },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * PENTING: nama export harus `config` (bukan `matcher`) agar Next.js
 * benar-benar membatasi middleware hanya ke route aplikasi. Tanpa ini,
 * aset `/_next/static/*` (CSS & JS) juga melewati middleware dan ikut
 * dialihkan ke /login → halaman tampil tanpa gaya dan form tidak berfungsi.
 */
export const config = {
  matcher: [
    /*
     * Cocokkan semua path KECUALI:
     * - _next/static (build assets)
     * - _next/image  (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - file statis berekstensi (svg, png, jpg, jpeg, gif, webp, ico, css, js, map, woff, woff2, ttf)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
