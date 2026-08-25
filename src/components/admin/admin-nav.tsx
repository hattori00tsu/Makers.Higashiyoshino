"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "ホーム" },
  { href: "/admin/events", label: "催し" },
  { href: "/admin/artists", label: "つくり手" },
  { href: "/admin/options", label: "項目" },
  { href: "/admin/applications", label: "申込み" },
  { href: "/admin/news", label: "お知らせ" },
  { href: "/admin/spots", label: "周辺" },
  { href: "/admin/settings", label: "設定" },
  { href: "/admin/manual", label: "使い方" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-10 flex flex-wrap gap-6 text-[13px] tracking-[0.16em]">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} prefetch={false} className={active ? "text-sumi" : "text-sumi-soft"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
