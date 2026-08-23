"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { ArtistForm } from "@/components/account/artist-form";
import {
  findArtistForAdmin,
  saveArtistForAdmin,
  type AdminArtistRecord,
} from "@/lib/content/live";
import { notifyArtistDecision } from "@/lib/mail/notify";

export default function AdminArtistEditPage() {
  const { ready, user } = useAdmin();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [artist, setArtist] = useState<AdminArtistRecord | null | undefined>(undefined);
  const localOnly = user?.source === "preview";

  useEffect(() => {
    if (!ready) return;
    findArtistForAdmin(params.slug, localOnly).then((item) => setArtist(item ?? null));
  }, [ready, params.slug, localOnly]);

  if (!ready || artist === undefined) {
    return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;
  }
  if (!artist) {
    return <p className="px-5 pt-28 text-sm text-sumi-soft">作家が見つかりません。</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">作家を編集</h1>
      <AdminNav />
      {artist.draft.slug ? (
        <p className="mb-10 text-sm text-sumi-soft">
          公開ページは
          <Link
            href={`/artists/${artist.draft.slug}`}
            className="mx-1 underline decoration-line underline-offset-4"
          >
            /artists/{artist.draft.slug}
          </Link>
          です。
        </p>
      ) : (
        <p className="mb-10 text-sm text-sumi-soft">公開URLを入れると、作家ページに出ます。</p>
      )}
      <ArtistForm
        key={params.slug}
        initial={artist.draft}
        email={artist.email}
        submitLabel="更新する"
        showSlug
        showStatus
        onSave={async (next) => {
          const previous = artist.draft.status;
          await saveArtistForAdmin(artist, next, localOnly);
          setArtist({ ...artist, draft: next });
          if (
            !localOnly &&
            previous !== next.status &&
            (next.status === "approved" || next.status === "rejected")
          ) {
            await notifyArtistDecision({
              name: next.name,
              artistId: artist.id,
              status: next.status,
            });
          }
          const nextPath = `/admin/artists/${next.slug || artist.id}`;
          if (nextPath !== `/admin/artists/${params.slug}`) {
            router.replace(nextPath);
          }
        }}
      />
    </div>
  );
}
