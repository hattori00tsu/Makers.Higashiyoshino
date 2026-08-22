"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmDelete } from "@/components/account/confirm-delete";
import { MypageNav } from "@/components/account/mypage-nav";
import { EventEditor } from "@/components/admin/event-editor";
import { useSession } from "@/lib/account/use-session";
import { getLocalAccount } from "@/lib/account/local";
import { fetchRemoteArtist } from "@/lib/account/remote";
import { deleteEventLive, findEventLive, saveEventLive } from "@/lib/content/live";
import { canEditArtistEvent, type EventItem } from "@/data/site";

export default function MypageEditEventPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user, loading } = useSession();
  const [event, setEvent] = useState<EventItem | null | undefined>(undefined);
  const [artistSlug, setArtistSlug] = useState("");
  const saving = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=/mypage/events/${params.slug}`);
      return;
    }
    if (user.artistStatus === "none") {
      router.replace("/mypage");
      return;
    }
    async function load() {
      if (!user) return;
      const localOnly = user.source === "preview";
      const slug = localOnly
        ? getLocalAccount(user.id)?.artist?.slug || user.artistSlug || ""
        : user.artistSlug || (await fetchRemoteArtist(user.id)).artist?.slug || "";
      setArtistSlug(slug);
      const next = await findEventLive(params.slug, localOnly);
      setEvent(next ?? null);
    }
    load();
  }, [user, loading, router, params.slug]);

  if (!user || event === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  if (!event || !canEditArtistEvent(event, artistSlug, user.role === "admin")) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">この催しは編集できません。</p>
      </div>
    );
  }

  const localOnly = user.source === "preview";

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">催しを編集</h1>
      <MypageNav />
      <EventEditor
        initial={event}
        mode="artist"
        ownerArtistSlug={artistSlug}
        localOnly={localOnly}
        submitLabel="更新する"
        onSave={async (next, previous) => {
          if (saving.current) return;
          saving.current = true;
          try {
            await saveEventLive(
              {
                ...next,
                kind: "program",
                status: event.status ?? "draft",
                parentSlug: event.parentSlug,
              },
              previous,
              localOnly,
            );
            router.push("/mypage/events");
          } catch (error) {
            saving.current = false;
            throw error;
          }
        }}
      />
      <ConfirmDelete
        onConfirm={async () => {
          await deleteEventLive(event.slug, localOnly);
          router.push("/mypage/events");
        }}
      />
    </div>
  );
}
