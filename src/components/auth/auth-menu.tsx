"use client";

import Link from "next/link";
import { useSession } from "@/lib/account/use-session";

type Props = {
  light?: boolean;
};

export function AuthMenu({ light = false }: Props) {
  const { user, loading } = useSession();
  const tone = light ? "text-kami/90 hover:text-kami" : "text-sumi hover:text-sugi";

  if (loading) {
    return <span className={`text-[12px] tracking-[0.16em] ${light ? "text-kami/50" : "text-sumi-soft"}`}>…</span>;
  }

  if (user) {
    return (
      <Link href="/mypage" prefetch={false} className={`text-[12px] tracking-[0.16em] ${tone}`}>
        ページ
      </Link>
    );
  }

  return (
    <Link href="/login" prefetch={false} className={`text-[12px] tracking-[0.16em] ${tone}`}>
      ログイン
    </Link>
  );
}
