import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db/db";
import { user } from "./db/schema";
import { getCurrentUser } from "./lib/auth/helpers";

const authRoutes = new Set(["/sign-in", "/sign-up"]);
const protectedRoutePrefixes = ["/dashboard"];

const matchesRoutePrefix = (pathname: string, route: string) => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

const redirectTo = (request: NextRequest, pathname: string) => {
  return NextResponse.redirect(new URL(pathname, request.url));
};

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isAuthRoute = authRoutes.has(pathname);
  const isProtectedRoute = protectedRoutePrefixes.some((route) =>
    matchesRoutePrefix(pathname, route),
  );

  if (!isAuthRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  const { userId } = await getCurrentUser();

  if (!userId) {
    if (!isProtectedRoute) {
      return NextResponse.next();
    }

    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const [existingUser] = await db
    .select({
      id: user.id,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existingUser) {
    return isProtectedRoute
      ? redirectTo(request, "/sign-in")
      : NextResponse.next();
  }

  if (isAuthRoute) {
    return redirectTo(request, "/dashboard");
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/sign-in", "/sign-up", "/dashboard/:path*"],
};
