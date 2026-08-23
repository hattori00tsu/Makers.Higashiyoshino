"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDelete } from "@/components/account/confirm-delete";
import { AdminNav } from "@/components/admin/admin-nav";
import { EventChildren } from "@/components/admin/event-children";
import { EventEditor } from "@/components/admin/event-editor";
import { useAdmin } from "@/components/admin/use-admin";
import { deleteEventLive, findEventLive, loadEventsLive, saveEventLive } from "@/lib/content/live";
import { inferEventKind, type EventItem } from "@/data/site";

export default function EditEventPage() {
  const { ready, user } = useAdmin();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventItem | null | undefined>(undefined);
  const [catalog, setCatalog] = useState<EventItem[]>([]);
  const localOnly = user?.source === "preview";
  const saving = useRef(false);

  const reload = useCallback(async () => {
    const [item, items] = await Promise.all([
      findEventLive(params.slug, localOnly),
      loadEventsLive(localOnly),
    ]);
    setEvent(item ?? null);
    setCatalog(items);
  }, [params.slug, localOnly]);

  useEffect(() => {
    if (!ready) return;
    reload();
  }, [ready, reload]);

  if (!ready || event === undefined) {
    return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;
  }
  if (!event) {
    return <p className="px-5 pt-28 text-sm text-sumi-soft">催しが見つかりません。</p>;
  }

  const kind = inferEventKind(event, catalog);

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">催しを編集</h1>
      <AdminNav />
      <EventChildren parent={event} catalog={catalog} localOnly={localOnly} onChanged={reload} />
      {kind !== "program" ? (
        <h2 className="mb-6 border-t border-line pt-10 font-serif text-xl tracking-wide">この催しの内容</h2>
      ) : null}
      <EventEditor
        initial={{ ...event, kind: inferEventKind(event, catalog) }}
        catalog={catalog}
        localOnly={localOnly}
        submitLabel="更新する"
        onSave={async (next, previous) => {
          if (saving.current) return;
          saving.current = true;
          try {
            await saveEventLive(next, previous, localOnly);
            router.push("/admin/events");
          } catch (error) {
            saving.current = false;
            throw error;
          }
        }}
      />
      <ConfirmDelete
        onConfirm={async () => {
          await deleteEventLive(event.slug, localOnly);
          router.push("/admin/events");
        }}
      />
    </div>
  );
}
