import type { SessionUser } from "@/lib/account/types";

export function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

export function isRegisterPath(path: string) {
  return path === "/register" || path.startsWith("/register?");
}

export function pathAfterLogin(user: SessionUser | null, requested?: string) {
  const next = requested && requested.startsWith("/") ? requested : "/mypage";
  if (!user) {
    return isAdminPath(next) ? "/admin/login" : next;
  }
  if (isAdminPath(next)) {
    if (user.role !== "admin") return "/admin/login?denied=1";
    return next === "/admin/login" ? "/admin" : next;
  }
  if (isRegisterPath(next)) {
    return user.artistStatus !== "none" ? "/mypage" : "/register";
  }
  return next;
}
