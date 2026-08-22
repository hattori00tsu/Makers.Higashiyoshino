"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { EventEditor, emptyEvent } from "@/components/admin/event-editor";
import { useAdmin } from "@/components/admin/use-admin";
import { findEventLive, saveEventLive } from "@/lib/content/live";
import { eventKindLabel, inferEventKind, type EventItem, type EventKind } from "@/data/site";

export default function NewEventPage() {
  const { ready } = useAdmin();
  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">催しを作る</h1>
      <AdminNav />
      <Suspense>
        <NewEventForm />
      </Suspense>
    </div>
  );
}

function NewEventForm() {
  const router = useRouter();
  const { user } = useAdmin();
  const params = useSearchParams();
  const parentSlug = params.get("parent") ?? "";
  const requestedKind = parseKind(params.get("kind"));
  const localOnly = user?.source === "preview";
  const [initial, setInitial] = useState<EventItem | undefined>(undefined);
  const [readyParent, setReadyParent] = useState(!parentSlug);
  const saving = useRef(false);

  useEffect(() => {
    if (!parentSlug) {
      if (requestedKind) setInitial(emptyEvent(requestedKind));
      return;
    }
    findEventLive(parentSlug, localOnly).then((parent) => {
      if (parent) {
        const parentKind = inferEventKind(parent, [parent]);
        const kind: EventKind = requestedKind ?? (parentKind === "festival" ? "venue" : "program");
        setInitial({
          ...emptyEvent(kind),
          parentSlug: parent.slug,
          sessions: parent.sessions,
          access: parent.access,
          venues: kind === "program" ? [] : parent.venues,
          parkings: kind === "program" ? [] : parent.parkings,
          image: parent.image,
          status: "published",
          allDay: kind === "festival",
        });
      }
      setReadyParent(true);
    });
  }, [parentSlug, localOnly, requestedKind]);

  if (!requestedKind && !parentSlug) {
    return (
      <div className="space-y-6">
        <p className="text-sm leading-7 text-sumi-soft">
          総合開催と会場は運営が作ります。個別の催しは、総合開催または会場のページから入れ、公開もそこで承認します。作家が作った公開待ちも、同じページから入れられます。
        </p>
        <ul className="divide-y divide-line border-y border-line">
          {(["festival", "venue", "program"] as EventKind[]).map((item) => (
            <li key={item} className="py-4">
              <Link href={`/admin/events/new?kind=${item}`} className="block">
                <p className="font-serif text-lg tracking-wide">{eventKindLabel(item)}</p>
                <p className="mt-1 text-sm text-sumi-soft">
                  {item === "festival"
                    ? "期間だけの枠。カレンダーに出ます。"
                    : item === "venue"
                      ? "総合開催がなくても公開できます。総合開催の下に置くこともできます。詳細な日程と終日日程の両方を入れられます。"
                      : "詳細な日程と、必要なら予約を付けられます。総合開催または会場のページからも作れます。"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!readyParent) return <p className="text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <EventEditor
      initial={initial}
      localOnly={localOnly}
      submitLabel="保存する"
      onSave={async (event) => {
        if (saving.current) return;
        saving.current = true;
        try {
          await saveEventLive(event, undefined, localOnly);
          router.push("/admin/events");
        } catch (error) {
          saving.current = false;
          throw error;
        }
      }}
    />
  );
}

function parseKind(value: string | null): EventKind | undefined {
  if (value === "festival" || value === "venue" || value === "program") return value;
  return undefined;
}
