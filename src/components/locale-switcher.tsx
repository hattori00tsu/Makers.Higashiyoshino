"use client";

import { useRouter } from "next/navigation";
import { localeCookieValue, type Locale } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/provider";

export function LocaleSwitcher({ light }: { light?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const muted = light ? "text-kami/70" : "text-sumi-soft";
  const active = light ? "text-kami" : "text-sumi";

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = localeCookieValue(next);
    document.documentElement.lang = next;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 text-[11px] tracking-[0.18em]">
      <button
        type="button"
        className={locale === "ja" ? active : muted}
        onClick={() => switchTo("ja")}
        aria-pressed={locale === "ja"}
      >
        JA
      </button>
      <span className={muted}>/</span>
      <button
        type="button"
        className={locale === "en" ? active : muted}
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
