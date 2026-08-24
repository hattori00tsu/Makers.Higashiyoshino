import Link from "next/link";
import { nav, site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
        <div className="space-y-3">
          <p className="font-serif text-lg tracking-wide">{site.shortName}</p>
          <p className="max-w-sm text-sm leading-7 text-sumi-soft">
            {site.name}
            <br />
            {site.prefecture}
          </p>
        </div>
        <div className="flex flex-col gap-6 md:items-end">
          <nav className="flex flex-wrap gap-8 text-[13px] tracking-[0.16em]">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-sugi">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="hover:text-sugi">
            ログイン
            </Link>
          </nav>
          <nav className="flex flex-wrap gap-8 text-[13px] tracking-[0.16em] text-sumi-soft">
            <Link href="/archive" className="hover:text-sugi">
              アーカイブ
            </Link>
            <Link href="/about" className="hover:text-sugi">
              このサイトについて
            </Link>
            <Link href="/privacy" className="hover:text-sugi">
              プライバシーポリシー
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
