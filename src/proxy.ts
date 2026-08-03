import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role as string | undefined;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

  // 1. Redirection for logged-in users on Auth routes (Login/Register)
  if (isAuthRoute && isLoggedIn) {
    if (role === "admin" || role === "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 2. Protection for Admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Only allow admin/super_admin on admin routes
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // /admin/system-design → strictly super_admin
    const isSystemDesignRoute = nextUrl.pathname.startsWith("/admin/system-design");
    if (isSystemDesignRoute && role !== "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', nextUrl.pathname);
  return response;
});

export const config = {
  matcher: ["/admin/:path*", "/login", "/register"],
};

