"use client";

import { createContext, useContext } from "react";
import { defaultLocale, type Locale } from "@/lib/i18n/locale";
import { messages, type Messages } from "@/lib/i18n/messages";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useMessages(): Messages {
  return messages[useLocale()];
}
