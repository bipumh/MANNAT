import { auth } from "@/lib/auth/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 `proxy` — delegates session refresh and route protection to Neon
 * Auth's middleware, then preserves the intended destination as a `next` query
 * param so the login flow can return the user where they were headed.
 */
const neonAuthMiddleware = auth.middleware({ loginUrl: "/login" });

export default async function proxy(request: NextRequest) {
  const response = await neonAuthMiddleware(request);

  const location = response.headers.get("location");
  if (location) {
    const redirectUrl = new URL(location, request.url);
    if (redirectUrl.pathname === "/login" && !redirectUrl.searchParams.has("next")) {
      redirectUrl.searchParams.set(
        "next",
        request.nextUrl.pathname + request.nextUrl.search,
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
