"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { PrimaryButton } from "@/components/account/fields";
import { useAdmin } from "@/components/admin/use-admin";
import { loadAdminCounts } from "@/lib/content/live";

export default function AdminPage() {
  const { user, ready, signOut } = useAdmin();
  const [counts, setCounts] = useState({ events: 0, artists: 0, applications: 0 });

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    loadAdminCounts(user.source === "preview").then((next) => {
      if (active) setCounts(next);
    });
    return () => {
      active = false;
    };
  }, [user?.source, user?.id, ready]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  async function onSignOut() {
    await signOut();
    window.location.assign("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">運営</h1>
      <p className="mt-2 text-sm text-sumi-soft">{user.email || "メール未登録"}</p>
      <AdminNav />

      <dl className="grid grid-cols-3 gap-4 border-y border-line py-6 text-center">
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-sumi-soft">催し</dt>
          <dd className="mt-2 font-serif text-2xl">{counts.events}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-sumi-soft">予約</dt>
          <dd className="mt-2 font-serif text-2xl">{counts.applications}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-sumi-soft">つくり手</dt>
          <dd className="mt-2 font-serif text-2xl">{counts.artists}</dd>
        </div>
      </dl>

      <p className="mt-12 text-sm text-sumi-soft">
        <Link href="/admin/manual" className="underline decoration-line underline-offset-4">
          使い方
        </Link>
        <span className="mx-3 text-line">/</span>
        <Link href="/" className="underline decoration-line underline-offset-4">
          公開サイトを見る
        </Link>
      </p>
      <div className="mt-10">
        <PrimaryButton type="button" onClick={onSignOut}>
          ログアウト
        </PrimaryButton>
      </div>
    </div>
  );
}
