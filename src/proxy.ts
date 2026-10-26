import { guardPublicRequest } from './lib/request-guard';
import { NextResponse, type NextRequest } from "next/server";

// The retired public-review link must no longer behave as a second storefront.
// Keep its private integration tests and provider callbacks on their original environment.
export async function proxy(request: NextRequest) {
  const guarded = await guardPublicRequest(request);
  if (guarded) return guarded;
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "feature/site-audit-preview"
      || !["GET", "HEAD"].includes(request.method)
      || /^\/(?:api|_next|admin|plata)(?:\/|$)/.test(request.nextUrl.pathname)) return NextResponse.next();
  const target = new URL("https://www.estorehouse.ro");
  target.pathname = request.nextUrl.pathname;
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 307);
}
export const config = { matcher: ["/api/:path*", "/((?!api|_next|admin|plata|.*\\..*).*)"] };
