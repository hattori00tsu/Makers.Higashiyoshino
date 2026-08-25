import type { SessionUser } from "@/lib/account/types";

export const visitPath = "/visit";
export const mypagePath = "/mypage";
export const registerPath = "/register";

export function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

export function isRegisterPath(path: string) {
  return path === "/register" || path.startsWith("/register?");
}

export function isMypagePath(path: string) {
  return path === "/mypage" || path.startsWith("/mypage/");
}

export function artistEntryPath(next?: string) {
  if (next && isMypagePath(next)) return `${registerPath}?next=${encodeURIComponent(next)}`;
  return registerPath;
}

export function loginEntryFor(path: string) {
  if (isAdminPath(path)) return "/admin/login";
  if (isMypagePath(path)) return registerPath;
  return "/login";
}

export function pathAfterLogin(user: SessionUser | null, requested?: string) {
  const next = requested && requested.startsWith("/") ? requested : "";
  if (!user) {
    return isAdminPath(next) ? "/admin/login" : next || visitPath;
  }
  if (isAdminPath(next)) {
    if (user.role !== "admin") return "/admin/login?denied=1";
    return next === "/admin/login" ? "/admin" : next;
  }
  if (isRegisterPath(next) || isMypagePath(next)) {
    if (user.artistStatus === "none") return registerPath;
    return isMypagePath(next) ? next : mypagePath;
  }
  return next || visitPath;
}
