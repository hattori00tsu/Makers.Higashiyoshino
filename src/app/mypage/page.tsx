"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MypageNav } from "@/components/account/mypage-nav";
import { PrimaryButton } from "@/components/account/fields";
import { VisitorReservations } from "@/components/account/visitor-reservations";
import { artistSlugForUser } from "@/lib/account/local";
import { partitionArtistEvents } from "@/lib/calendar";
import { eventAncestorTitle, eventCategoryLabel, eventsForArtist } from "@/data/site";
import { loadEventsForArtistLive } from "@/lib/content/live";
import { useSession } from "@/lib/account/use-session";
import { formatDateJa } from "@/lib/dates";
import type { EventItem } from "@/data/site";

export default function MypagePage() {
  const router = useRouter();
  const { user, loading, signOut } = useSession();
  const [joined, setJoined] = useState<EventItem[]>([]);
  const [catalog, setCatalog] = useState<EventItem[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/mypage");
      return;
    }
    if (user.artistStatus === "none") return;
    const slug = artistSlugForUser(user);
    const localOnly = user.source === "preview";
    let active = true;
    loadEventsForArtistLive(slug, localOnly, { publishedOnly: true }).then((all) => {
      if (!active) return;
      setCatalog(all);
      setJoined(slug ? eventsForArtist(slug, all) : []);
    });
    return () => {
      active = false;
    };
  }, [user?.id, user?.artistSlug, user?.artistStatus, user?.source, loading, router, user]);

  async function onSignOut() {
    await signOut();
    window.location.assign("/");
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  if (user.artistStatus === "none") {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">ACCOUNT</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">{user.name}</h1>
        <p className="mt-8 text-sm leading-7 text-sumi-soft">
          申し込んだ催しです。参加予定の予約は、ここからキャンセルを申請できます。
          {user.role === "admin" ? " 運営画面はこのアカウントのまま使えます。" : ""}
        </p>
        <VisitorReservations user={user} />
        <div className="mt-14">
          <PrimaryButton type="button" onClick={onSignOut}>
            ログアウト
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const slug = artistSlugForUser(user);
  const publicHref = slug ? `/artists/${slug}` : null;
  const { upcoming, past } = partitionArtistEvents(joined);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">{user.name}</h1>
      <MypageNav />

      {user.artistStatus === "approved" ? (
        <p className="text-sm leading-7 text-sumi-soft">
          プロフィールと作品を整えると、公開ページへ反映されます。個別の催しは
          <Link href="/mypage/events" className="underline decoration-line underline-offset-4">
            催し
          </Link>
          から作れます。公開と、総合開催・会場への配置は運営が行います。予約が入ると通知が届き、
          <Link href="/mypage/applications" className="underline decoration-line underline-offset-4">
            申込み
          </Link>
          で予約者を確認できます。
          {publicHref ? (
            <>
              {" "}
              公開ページ：
              <Link href={publicHref} className="underline decoration-line underline-offset-4">
                見る
              </Link>
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-sm leading-7 text-sumi-soft">
          いまは非公開です。運営が公開すると、作家ページがサイトに出ます。それまで
          <Link href="/mypage/profile" className="underline decoration-line underline-offset-4">
            プロフィール
          </Link>
          と
          <Link href="/mypage/works" className="underline decoration-line underline-offset-4">
            作品
          </Link>
          を整えられます。
        </p>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <p className="mt-12 text-sm text-sumi-soft">
          参加予定と過去の催しは、紐付いたあと、またはあなたが作ったあとにここに並びます。
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          <JoinedGroup heading="参加予定の催し" items={upcoming} catalog={catalog} />
          <JoinedGroup heading="過去の参加" items={past} catalog={catalog} />
        </div>
      )}

      <div className="mt-14">
        <PrimaryButton type="button" onClick={onSignOut}>
          ログアウト
        </PrimaryButton>
      </div>
    </div>
  );
}

function JoinedGroup({
  heading,
  items,
  catalog,
}: {
  heading: string;
  items: EventItem[];
  catalog: EventItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-serif text-xl tracking-wide">{heading}</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {items.map((event) => {
          const ancestor = eventAncestorTitle(event, catalog);
          return (
            <li key={event.slug} className="py-4">
              <Link href={`/events/${event.slug}`} className="block">
                <p className="text-[11px] tracking-[0.16em] text-tsuchi">
                  {ancestor || eventCategoryLabel(event.categories)}
                  <span className="mx-2 text-line">/</span>
                  {formatDateJa(event.sessions[0]?.startsAt ?? "")}
                </p>
                <p className="mt-1 font-serif text-lg tracking-wide">{event.title}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
