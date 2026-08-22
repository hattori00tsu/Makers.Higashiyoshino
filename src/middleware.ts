import { type NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/account/types";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const guarded = ["/mypage", "/admin"];

function isAdminLogin(pathname: string) {
  return pathname === "/admin/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth =
    guarded.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
    !isAdminLogin(pathname);

  const { response, userId } = await updateSupabaseSession(request);
  const preview = request.cookies.get(PREVIEW_COOKIE)?.value;
  const signedIn = Boolean(userId || (!isSupabaseConfigured() && preview));

  if (needsAuth && !signedIn) {
    const login = new URL(pathname.startsWith("/admin") ? "/admin/login" : "/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
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
  matcher: ["/mypage/:path*", "/admin/:path*", "/register", "/login"],
};
