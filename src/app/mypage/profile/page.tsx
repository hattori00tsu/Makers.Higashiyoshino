"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArtistForm } from "@/components/account/artist-form";
import { MypageNav } from "@/components/account/mypage-nav";
import { emptyDraft, type ArtistDraft } from "@/lib/account/types";
import { getLocalAccount, saveLocalDraft } from "@/lib/account/local";
import { fetchRemoteArtist, upsertRemoteArtist } from "@/lib/account/remote";
import { useSession } from "@/lib/account/use-session";
import { artistEntryPath } from "@/lib/account/paths";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [draft, setDraft] = useState<ArtistDraft | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(artistEntryPath("/mypage/profile"));
      return;
    }
    if (user.artistStatus === "none") {
      router.replace(artistEntryPath());
      return;
    }
    async function load() {
      if (!user) return;
      if (user.source === "preview") {
        setDraft(getLocalAccount(user.id)?.artist ?? emptyDraft());
        return;
      }
      const remote = await fetchRemoteArtist(user.id);
      setDraft(remote.artist ?? emptyDraft());
    }
    load();
  }, [user?.id, user?.artistStatus, user?.source, loading, router]);

  if (!draft || !user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">PROFILE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">プロフィール</h1>
      <MypageNav />
      <ArtistForm
        initial={draft}
        email={user.email}
        submitLabel="保存する"
        onSave={async (next) => {
          if (user.source === "preview") saveLocalDraft(user.id, next);
          else await upsertRemoteArtist(user.id, next);
        }}
      />
    </div>
  );
}
