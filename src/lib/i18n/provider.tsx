"use client";

import { createContext, useContext } from "react";
import { defaultEventOptions, type EventOptions } from "@/lib/content/options";
import { namedLabel } from "@/lib/i18n/content";
import { defaultLocale, type Locale } from "@/lib/i18n/locale";
import { messages, type Messages } from "@/lib/i18n/messages";

const LocaleContext = createContext<Locale>(defaultLocale);
const CatalogContext = createContext<EventOptions>(defaultEventOptions());

export function LocaleProvider({
  locale,
  options,
  children,
}: {
  locale: Locale;
  options?: EventOptions;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <CatalogContext.Provider value={options ?? defaultEventOptions()}>{children}</CatalogContext.Provider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useCatalog() {
  return useContext(CatalogContext);
}

export function useMessages(): Messages {
  return messages[useLocale()];
}

export function useSeriesLabel(name: string) {
  return namedLabel(name, useCatalog().series, useLocale());
}
