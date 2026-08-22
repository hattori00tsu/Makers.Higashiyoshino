"use client";

import { usePathname } from "next/navigation";
import { useAdmin } from "@/components/admin/use-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const { ready } = useAdmin({ skip: isLogin });
  if (isLogin) return children;
  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;
  return children;
}
