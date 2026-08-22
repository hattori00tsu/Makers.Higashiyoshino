"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { remainingSeatsLive } from "@/lib/content/live";
import { isPublished, needsReservation, sessionCapacity, type EventItem } from "@/data/site";
import { formatSessionRange } from "@/lib/dates";

export const applyButtonClass =
  "inline-flex items-center justify-center border border-sumi bg-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] text-kami transition-opacity hover:opacity-90";

export function ApplyButton({ href, children = "申し込む" }: { href: string; children?: string }) {
  return (
    <Link href={href} className={applyButtonClass}>
      {children}
    </Link>
  );
}

export function EventApplyCta({ event }: { event: EventItem }) {
  const [leftBySession, setLeftBySession] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!isPublished(event) || !needsReservation(event)) return;
    Promise.all(
      event.sessions.map(async (session) => {
        const cap = sessionCapacity(session, event);
        return [session.startsAt, await remainingSeatsLive(event.slug, cap, false, session.startsAt)] as const;
      }),
    ).then((entries) => setLeftBySession(Object.fromEntries(entries)));
  }, [event]);

  if ((event.status ?? "published") === "cancelled") {
    return (
      <p className="mt-8 border border-line bg-kami px-4 py-4 text-sm leading-7 text-sumi-soft">
        この催しは中止になりました。
      </p>
    );
  }

  if (!isPublished(event) || !needsReservation(event)) return null;

  const dated = event.sessions.filter((session) => session.startsAt);
  const full =
    dated.length > 0 &&
    dated.every((session) => {
      const cap = sessionCapacity(session, event);
      if (cap == null) return false;
      return leftBySession[session.startsAt] === 0;
    });

  return (
    <div className="mt-8 border-y border-line py-6">
      <p className="text-sm leading-7 text-sumi-soft">
        {full
          ? "ただいま定員に達しています。キャンセルが出た場合のみ、ご連絡します。"
          : "事前の予約をお願いします。申込みにはログイン（登録）が必要です。定員は日程ごとに異なります。"}
      </p>

      {full ? null : (
        <div className="mt-4">
          <ApplyButton href={`/events/${event.slug}/apply`} />
        </div>
      )}
    </div>
  );
}
