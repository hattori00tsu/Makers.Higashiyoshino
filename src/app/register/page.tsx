"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArtistForm } from "@/components/account/artist-form";
import { LoginPanel } from "@/components/auth/login-panel";
import { emptyDraft } from "@/lib/account/types";
import { submitLocalApplication } from "@/lib/account/local";
import { upsertRemoteArtist } from "@/lib/account/remote";
import { notifyOps } from "@/lib/mail/notify";
import { useSession } from "@/lib/account/use-session";
import { isMypagePath, visitPath } from "@/lib/account/paths";

export default function RegisterPage() {
  return (
    <Suspense fallback={<Gate />}>
      <RegisterBody />
    </Suspense>
  );
}

function RegisterBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useSession();
  const [ready, setReady] = useState(false);
  const [initial] = useState(() => emptyDraft());
  const requested = searchParams.get("next") ?? "";
  const artistNext = isMypagePath(requested) ? requested : "/mypage";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    if (user.artistStatus !== "none") {
      router.replace(artistNext);
      return;
    }
    setReady(true);
  }, [user?.id, user?.artistStatus, loading, router, artistNext]);

  if (loading || !ready) return <Gate />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARTIST</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">つくり手として入る</h1>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          Google、またはメールに届くリンクで入ったあと、作家登録ができます。パスワードはありません。
        </p>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          登録したメールは、通知メールに使用されます。イベント開催時に参加者とのやり取りにも使われます。
        </p>
        <div className="mt-10">
          <LoginPanel intent="artist" nextPath={isMypagePath(requested) ? requested : "/register"} />
        </div>
        <p className="mt-10 text-sm text-sumi-soft">
          催しの予約確認は
          <Link href={visitPath} className="mx-1 underline decoration-line underline-offset-4">
            来訪者
          </Link>
          からです。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">APPLY</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">つくり手登録</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        登録すると、プロフィールと作品を整えられます。公開は運営が行います。Google
        またはメールのアカウントと紐づきます。取り扱いは
        <Link href="/privacy" className="mx-1 underline decoration-line underline-offset-4">
          プライバシーポリシー
        </Link>
        をご確認ください。
      </p>
      <div className="mt-10">
        <ArtistForm
          initial={initial}
          submitLabel="登録する"
          onSave={async (draft) => {
            if (user.source === "preview") {
              submitLocalApplication(user.id, draft);
            } else {
              await upsertRemoteArtist(user.id, draft);
              await notifyOps({ type: "artist", name: draft.name });
            }
            router.push("/mypage");
            router.refresh();
          }}
        />
      </div>
      <p className="mt-10 text-sm text-sumi-soft">
        <Link href="/" className="underline decoration-line underline-offset-4">
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}

function Gate() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-28">
      <p className="text-sm text-sumi-soft">読み込み中です。</p>
    </div>
  );
}
