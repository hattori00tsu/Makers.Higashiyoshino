"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MypageNav } from "@/components/account/mypage-nav";
import { EventEditor, emptyEvent } from "@/components/admin/event-editor";
import { useSession } from "@/lib/account/use-session";
import { artistSlugForUser } from "@/lib/account/local";
import { saveEventLive } from "@/lib/content/live";
import { notifyOps } from "@/lib/mail/notify";
import { artistEntryPath } from "@/lib/account/paths";

export default function MypageNewEventPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [artistSlug, setArtistSlug] = useState("");
  const saving = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(artistEntryPath("/mypage/events/new"));
      return;
    }
    if (user.artistStatus === "none") {
      router.replace(artistEntryPath());
      return;
    }
    async function load() {
      if (!user) return;
      setArtistSlug(artistSlugForUser(user));
    }
    load();
  }, [user?.id, user?.artistStatus, loading, router]);

  if (!user || !artistSlug) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">催しを作る</h1>
      <MypageNav />
      <EventEditor
        initial={emptyEvent("program")}
        mode="artist"
        ownerArtistSlug={artistSlug}
        localOnly={user.source === "preview"}
        submitLabel="保存する"
        onSave={async (event) => {
          if (saving.current) return;
          saving.current = true;
          try {
            await saveEventLive(
              { ...event, kind: "program", status: "draft", parentSlug: undefined },
              undefined,
              user.source === "preview",
            );
            if (user.source !== "preview") {
              await notifyOps({
                type: "event",
                name: user.name,
                eventTitle: event.title,
                eventSlug: event.slug,
              });
            }
            router.push("/mypage/events");
          } catch (error) {
            saving.current = false;
            throw error;
          }
        }}
      />
    </div>
  );
}
