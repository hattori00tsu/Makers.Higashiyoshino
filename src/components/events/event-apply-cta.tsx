"use client";

import Link from "next/link";
import { useLiveSeats } from "@/components/events/live-seats";
import { liveSeatKey } from "@/lib/content/live";
import { isPublished, needsReservation, sessionCapacity, type EventItem } from "@/data/site";
import { useMessages } from "@/lib/i18n/provider";

export const applyButtonClass =
  "inline-flex items-center justify-center border border-sumi bg-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] text-kami transition-opacity hover:opacity-90";

export function ApplyButton({ href, children }: { href: string; children?: React.ReactNode }) {
  const t = useMessages();
  return (
    <Link href={href} className={applyButtonClass}>
      {children ?? t.events.apply}
    </Link>
  );
}

export function EventApplyCta({ event }: { event: EventItem }) {
  const seats = useLiveSeats() ?? {};
  const t = useMessages();

  if ((event.status ?? "published") === "cancelled") {
    return (
      <p className="mt-8 border border-line bg-kami px-4 py-4 text-sm leading-7 text-sumi-soft">
        {t.events.cancelled}
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
      return seats[liveSeatKey(event.slug, session.startsAt)] === 0;
    });

  return (
    <div className="mt-8 border-y border-line py-6">
      <p className="text-sm leading-7 text-sumi-soft">
        {full
          ? t.events.fullWaitlist
          : t.events.pleaseReserve}
      </p>

      {full ? null : (
        <div className="mt-4">
          <ApplyButton href={`/events/${event.slug}/apply`} />
        </div>
      )}
    </div>
  );
}
