"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { loadArtistsForAdmin, type AdminArtistRecord } from "@/lib/content/live";

const statusLabel: Record<string, string> = {
  approved: "公開",
  rejected: "非公開",
  pending: "確認待ち",
};

function artistHref(item: AdminArtistRecord) {
  return `/admin/artists/${item.draft.slug || item.id}`;
}

export default function AdminArtistsPage() {
  const { ready, user } = useAdmin();
  const [items, setItems] = useState<AdminArtistRecord[]>([]);
  const localOnly = user?.source === "preview";

  useEffect(() => {
    if (ready) loadArtistsForAdmin(localOnly).then(setItems);
  }, [ready, localOnly]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">つくり手</h1>
      <AdminNav />
      <div className="mb-10">
        <Link
          href="/admin/artists/new"
          className="inline-flex items-center border border-sumi bg-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] text-kami"
        >
          つくり手を追加
        </Link>
        <p className="mt-6 text-sm leading-7 text-sumi-soft">
          運営からもつくり手を追加できます。つくり手自身の登録は非公開ではじまり、ここで公開します。登録済みのつくり手は、プロフィールと公開／非公開を直せます。作品の追加は各作家のマイページから行います。
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-sumi-soft">登録されたつくり手はまだいません。</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-[11px] tracking-[0.14em] text-tsuchi">
                  {statusLabel[item.draft.status] ?? item.draft.status}
                  {item.draft.genre ? (
                    <>
                      <span className="mx-2 text-line">/</span>
                      {item.draft.genre}
                    </>
                  ) : null}
                  {item.draft.area ? (
                    <>
                      <span className="mx-2 text-line">/</span>
                      {item.draft.area}
                    </>
                  ) : null}
                </p>
                <p className="mt-1 font-serif text-lg tracking-wide">{item.draft.name || "名前未設定"}</p>
                <p className="mt-1 text-sm text-sumi-soft">{item.email || "メール未登録"}</p>
              </div>
              <Link href={artistHref(item)} className="text-[13px] tracking-[0.14em] text-sugi">
                編集
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
