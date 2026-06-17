import { auth } from "~/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
  if (isAdminRoute && !isAdmin)
    return NextResponse.redirect(new URL("/dashboard", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
