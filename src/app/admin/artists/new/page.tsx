"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { ArtistForm } from "@/components/account/artist-form";
import { emptyDraft } from "@/lib/account/types";
import { createArtistForAdmin } from "@/lib/content/live";

export default function AdminArtistNewPage() {
  const { ready, user } = useAdmin();
  const router = useRouter();
  const saving = useRef(false);
  const localOnly = user?.source === "preview";

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">作家を追加</h1>
      <AdminNav />
      <p className="mb-10 text-sm leading-7 text-sumi-soft">
        アカウントがなくても、公開ページ用のつくり手を追加できます。作品の追加は、本人がマイページから行います。
      </p>
      <ArtistForm
        initial={emptyDraft()}
        submitLabel="追加する"
        showSlug
        showStatus
        onSave={async (next) => {
          if (saving.current) return;
          saving.current = true;
          try {
            const created = await createArtistForAdmin(next, localOnly);
            router.push(`/admin/artists/${created.draft.slug || created.id}`);
          } catch (error) {
            saving.current = false;
            throw error;
          }
        }}
      />
    </div>
  );
}
