import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SessionProvider } from "@/lib/account/use-session";
import { loadPublicEventOptions } from "@/lib/content/public-options";
import { LocaleProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";
import { messages } from "@/lib/i18n/messages";
import { site } from "@/data/site";
import "./globals.css";

const mincho = Shippori_Mincho({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mincho",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "serif"],
});

const gothic = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gothic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Hiragino Sans", "Yu Gothic", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: {
      default: site.name,
      template: `%s | ${site.shortName}`,
    },
    description: messages[locale].site.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const options = await loadPublicEventOptions();
  const t = messages[locale];
  const items = [
    { href: "/events", label: t.nav.events },
    { href: "/artists", label: t.nav.artists },
    { href: "/map", label: t.nav.map },
    { href: "/news", label: t.nav.news },
  ];

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${mincho.variable} ${gothic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-washi font-sans text-sumi">
        <LocaleProvider locale={locale} options={options}>
          <SessionProvider>
            <SiteHeader items={items} shortName={site.shortName} name={site.name} />
            <main className="flex-1">{children}</main>
            <SiteFooter items={items} />
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
