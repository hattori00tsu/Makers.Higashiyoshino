import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { getMessages } from "@/lib/i18n/server";

export async function SiteFooter({
  items,
}: {
  items: readonly { href: string; label: string }[];
}) {
  const t = await getMessages();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
        <div className="space-y-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5"
          >
            <Image
              src="/brand-mark.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 opacity-55 transition-opacity group-hover:opacity-80"
            />
            <span className="font-serif text-lg tracking-wide">{site.shortName}</span>
          </Link>
          <p className="max-w-sm text-sm leading-7 text-sumi-soft">
            {site.name}
            <br />
          </p>
        </div>
        <div className="flex flex-col gap-6 md:items-end">
          <nav className="flex flex-wrap gap-8 text-[13px] tracking-[0.16em]">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-sugi">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="flex flex-wrap gap-8 text-[13px] tracking-[0.16em] text-sumi-soft">
            <Link href="/login" className="hover:text-sugi">
              {t.footer.login}
            </Link>
            <Link href="/archive" className="hover:text-sugi">
              {t.footer.archive}
            </Link>
            <Link href="/about" className="hover:text-sugi">
              {t.footer.about}
            </Link>
            <Link href="/privacy" className="hover:text-sugi">
              {t.footer.privacy}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
