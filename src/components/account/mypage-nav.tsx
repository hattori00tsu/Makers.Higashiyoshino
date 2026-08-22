"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/mypage", label: "ホーム" },
  { href: "/mypage/reservations", label: "予約" },
  { href: "/mypage/events", label: "催し" },
  { href: "/mypage/applications", label: "申込み" },
  { href: "/mypage/profile", label: "プロフィール" },
  { href: "/mypage/works", label: "作品" },
];

export function MypageNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-10 flex flex-wrap gap-6 text-[13px] tracking-[0.16em]">
      {items.map((item) => {
        const active =
          item.href === "/mypage"
            ? pathname === "/mypage"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={active ? "text-sumi" : "text-sumi-soft"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
