"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/settings", label: "トップ" },
  { href: "/admin/settings/mail", label: "メール" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="-mt-4 mb-10 flex flex-wrap gap-6 text-[13px] tracking-[0.16em]">
      {items.map((item) => {
        const active =
          item.href === "/admin/settings" ? pathname === "/admin/settings" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={active ? "text-sumi" : "text-sumi-soft"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
