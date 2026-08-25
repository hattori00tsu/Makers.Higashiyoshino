import { type NextRequest, NextResponse } from "next/server";
import { loginEntryFor } from "@/lib/account/paths";
import { PREVIEW_COOKIE } from "@/lib/account/types";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { hasSupabaseAuthCookie, isPrefetchRequest } from "@/lib/supabase/auth-cookie";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const guarded = ["/mypage", "/admin"];

function isAdminLogin(pathname: string) {
  return pathname === "/admin/login";
}

function signedInFromCookies(request: NextRequest) {
  const preview = request.cookies.get(PREVIEW_COOKIE)?.value;
  return Boolean(hasSupabaseAuthCookie(request.cookies.getAll()) || (!isSupabaseConfigured() && preview));
}

function authEntry(request: NextRequest, pathname: string) {
  const login = new URL(loginEntryFor(pathname), request.url);
  login.searchParams.set("next", pathname);
  return login;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth =
    guarded.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
    !isAdminLogin(pathname);

  if (isPrefetchRequest(request)) {
    const preview = request.cookies.get(PREVIEW_COOKIE)?.value;
    const signedIn = signedInFromCookies(request);
    if (needsAuth && !signedIn) {
      return NextResponse.redirect(authEntry(request, pathname));
    }
    if (pathname.startsWith("/admin") && !isAdminLogin(pathname) && preview && preview !== "preview-admin" && !hasSupabaseAuthCookie(request.cookies.getAll())) {
      return NextResponse.redirect(new URL("/admin/login?denied=1", request.url));
    }
    return NextResponse.next();
  }

  const { response, userId } = await updateSupabaseSession(request);
  const preview = request.cookies.get(PREVIEW_COOKIE)?.value;
  const signedIn = Boolean(userId || (!isSupabaseConfigured() && preview));

  if (needsAuth && !signedIn) {
    return NextResponse.redirect(authEntry(request, pathname));
  }

  if (
    pathname.startsWith("/admin") &&
    !isAdminLogin(pathname) &&
    preview &&
    preview !== "preview-admin" &&
    !userId
  ) {
    return NextResponse.redirect(new URL("/admin/login?denied=1", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/mypage/:path*", "/admin/:path*"],
};
