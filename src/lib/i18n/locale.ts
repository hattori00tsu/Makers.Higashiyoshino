export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";
export const localeCookie = "hy-locale";

export function parseLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "ja";
}

export function pickCopy(locale: Locale, ja: string, en?: string | null) {
  if (locale === "en") {
    const next = en?.trim() ?? "";
    if (next) return next;
  }
  return ja ?? "";
}

export function localeCookieValue(locale: Locale) {
  return `${localeCookie}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function localeFromCookieHeader(header?: string | null): Locale {
  const match = header?.match(/(?:^|;\s*)hy-locale=([^;]*)/);
  return parseLocale(match?.[1]);
}
