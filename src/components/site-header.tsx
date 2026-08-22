"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthMenu } from "@/components/auth/auth-menu";
import { nav, site } from "@/data/site";

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = !overlay || scrolled || open;
  const light = overlay && !solid;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-washi/95 text-sumi" : "bg-transparent text-kami"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-16 md:px-8">
        <Link href="/" className="flex items-baseline gap-2 tracking-wide">
          <span className="font-serif text-[17px] leading-none">{site.shortName}</span>
          <span
            className={`hidden text-[10px] tracking-[0.28em] sm:inline ${
              light ? "text-kami/80" : "text-sumi-soft"
            }`}
          >
            ARTISTS
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] tracking-[0.14em] transition-opacity hover:opacity-70 ${
                pathname.startsWith(item.href) ? "opacity-100" : "opacity-80"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <AuthMenu light={light} />
          <button
            type="button"
            className="relative h-10 w-10 md:hidden"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setOpen((value) => !value)}
          >
            <span
              className={`absolute left-2 right-2 h-px transition-all ${
                light ? "bg-kami" : "bg-sumi"
              } ${open ? "top-1/2 rotate-45" : "top-[15px]"}`}
            />
            <span
              className={`absolute left-2 right-2 h-px transition-all ${
                light ? "bg-kami" : "bg-sumi"
              } ${open ? "top-1/2 -rotate-45" : "top-[23px]"}`}
            />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 top-14 z-40 bg-washi px-8 pt-10 text-sumi md:hidden">
          <nav className="flex flex-col gap-7">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-serif text-3xl tracking-wide"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-16 text-sm tracking-wide text-sumi-soft">{site.prefecture}</p>
        </div>
      ) : null}
    </header>
  );
}
