"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MypageNav } from "@/components/account/mypage-nav";
import { useSession } from "@/lib/account/use-session";
import { artistSlugForUser } from "@/lib/account/local";
import { loadEventsForArtistLive } from "@/lib/content/live";
import { canEditArtistEvent, eventsManagedByArtist, type EventItem } from "@/data/site";
import { formatDateJa } from "@/lib/dates";

const statusLabel: Record<string, string> = {
  draft: "公開待ち",
  published: "公開",
  cancelled: "中止",
};

export default function MypageEventsPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [items, setItems] = useState<EventItem[]>([]);
  const [artistSlug, setArtistSlug] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/mypage/events");
      return;
    }
    if (user.artistStatus === "none") {
      router.replace("/mypage");
      return;
    }
    async function load() {
      if (!user) return;
      const localOnly = user.source === "preview";
      const slug = artistSlugForUser(user);
      setArtistSlug(slug);
      const all = await loadEventsForArtistLive(slug, localOnly);
      setItems(slug ? eventsManagedByArtist(slug, all) : []);
    }
    load();
  }, [user?.id, user?.artistSlug, user?.artistStatus, user?.source, loading, router, user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">催し</h1>
      <MypageNav />
      <p className="text-sm leading-7 text-sumi-soft">
        個別の催しを作ります。総合開催・会場への配置と公開は、運営が行います。保存したあとは公開待ちになり、承認されるとサイトへ出ます。
      </p>
      <Link
        href="/mypage/events/new"
        className="mt-8 inline-flex items-center border border-sumi bg-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] text-kami"
      >
        新しく作る
      </Link>
      {items.length === 0 ? (
        <p className="mt-10 text-sm text-sumi-soft">まだ催しはありません。</p>
      ) : (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {items.map((event) => {
            const editable = canEditArtistEvent(event, artistSlug, user.role === "admin");
            return (
              <li key={event.slug} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-[11px] tracking-[0.14em] text-tsuchi">
                    {statusLabel[event.status ?? "published"]}
                    <span className="mx-2 text-line">/</span>
                    {event.sessions[0] ? formatDateJa(event.sessions[0].startsAt) : "日程未設定"}
                    {event.requiresReservation ? (
                      <>
                        <span className="mx-2 text-line">/</span>
                        要予約
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 font-serif text-lg tracking-wide">{event.title}</p>
                </div>
                {editable ? (
                  <Link href={`/mypage/events/${event.slug}`} className="text-[13px] tracking-[0.14em] text-sugi">
                    編集
                  </Link>
                ) : (
                  <Link href={`/events/${event.slug}`} className="text-[13px] tracking-[0.14em] text-sumi-soft">
                    見る
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
