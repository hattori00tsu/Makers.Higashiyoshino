"use client";

import { useSession } from "@/lib/account/use-session";
import { LoginPanel } from "@/components/auth/login-panel";
import { PrimaryButton } from "@/components/account/fields";
import { VisitorReservations } from "@/components/account/visitor-reservations";
import { visitPath } from "@/lib/account/paths";

export default function VisitPage() {
  const { user, loading, signOut } = useSession();

  async function onSignOut() {
    await signOut();
    window.location.assign("/");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">VISIT</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">来訪者</h1>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          催しの参加予約の確認とキャンセルのための入口です。Google、またはメールに届くリンクで入れます。パスワードはありません。
        </p>
        <div className="mt-10">
          <LoginPanel intent="visitor" nextPath={visitPath} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">VISIT</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">参加予約</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
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
