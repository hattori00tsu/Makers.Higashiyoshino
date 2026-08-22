"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MypageNav } from "@/components/account/mypage-nav";
import { VisitorReservations } from "@/components/account/visitor-reservations";
import { useSession } from "@/lib/account/use-session";

export default function MypageReservationsPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/mypage/reservations");
      return;
    }
    if (user.artistStatus === "none") {
      router.replace("/mypage");
    }
  }, [user, loading, router]);

  if (!user || user.artistStatus === "none") {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">予約</h1>
      <MypageNav />
      <p className="text-sm leading-7 text-sumi-soft">
        来訪者として申し込んだ催しです。参加予定の予約は、ここからキャンセルを申請できます。
      </p>
      <VisitorReservations user={user} />
    </div>
  );
}
