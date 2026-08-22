"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArtistForm } from "@/components/account/artist-form";
import { LoginPanel } from "@/components/auth/login-panel";
import { emptyDraft } from "@/lib/account/types";
import { submitLocalApplication } from "@/lib/account/local";
import { upsertRemoteArtist } from "@/lib/account/remote";
import { useSession } from "@/lib/account/use-session";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [ready, setReady] = useState(false);
  const [initial] = useState(() => emptyDraft());

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    if (user.artistStatus === "approved") {
      router.replace("/mypage");
      return;
    }
    setReady(true);
  }, [user, loading, router]);

  if (loading || !ready) return <Gate />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARTIST</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">つくり手として入る</h1>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          村に工房を構えている方の入口です。Google、またはメールに届くリンクで入ったあと、作家登録ができます。パスワードはありません。
        </p>
        <div className="mt-10">
          <LoginPanel intent="artist" nextPath="/register" />
        </div>
        <p className="mt-10 text-sm text-sumi-soft">
          催しの申込みは
          <Link href="/login" className="mx-1 underline decoration-line underline-offset-4">
            来訪者の入口
          </Link>
          です。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">APPLY</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">作家登録</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        登録すると、マイページでプロフィールと作品を公開できます。Google
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
