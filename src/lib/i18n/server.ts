import { cookies } from "next/headers";
import { defaultLocale, localeCookie, parseLocale, type Locale } from "@/lib/i18n/locale";
import { messages, type Messages } from "@/lib/i18n/messages";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(localeCookie)?.value) || defaultLocale;
}

export async function getMessages(): Promise<Messages> {
  const locale = await getLocale();
  return messages[locale];
}
