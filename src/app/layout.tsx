import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SessionProvider } from "@/lib/account/use-session";
import { nav, site } from "@/data/site";
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

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      data-scroll-behavior="smooth"
      className={`${mincho.variable} ${gothic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-washi font-sans text-sumi">
        <SessionProvider>
          <SiteHeader items={nav} shortName={site.shortName} name={site.name} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
