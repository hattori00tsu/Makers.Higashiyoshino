"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Field, PrimaryButton, TextArea } from "@/components/account/fields";
import { cancelApplicationLive, loadEventsLive, loadMyApplicationsLive } from "@/lib/content/live";
import type { Application } from "@/lib/content/applications";
import { eventPathTitle, type EventItem } from "@/data/site";
import { formatDateJa, formatSessionRange } from "@/lib/dates";
import type { SessionUser } from "@/lib/account/types";

function sessionOf(row: Application, events: EventItem[]) {
  const event = events.find((item) => item.slug === row.eventSlug);
  const session = event?.sessions.find((item) => item.startsAt === row.sessionStartsAt);
  if (session) return formatSessionRange(session.startsAt, session.endsAt);
  return formatDateJa(row.sessionStartsAt);
}

function sessionEnd(row: Application, events: EventItem[]) {
  const event = events.find((item) => item.slug === row.eventSlug);
  const session = event?.sessions.find((item) => item.startsAt === row.sessionStartsAt);
  return new Date(session?.endsAt || row.sessionStartsAt).getTime();
}

function isUpcoming(row: Application, events: EventItem[]) {
  return sessionEnd(row, events) >= Date.now();
}

export function VisitorReservations({ user }: { user: SessionUser }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rows, setRows] = useState<Application[] | null>(null);
  const [message, setMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const localOnly = user.source === "preview";

  async function refresh() {
    const [nextEvents, nextRows] = await Promise.all([
      loadEventsLive(localOnly),
      loadMyApplicationsLive(user.id, localOnly),
    ]);
    setEvents(nextEvents);
    setRows(nextRows);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const [nextEvents, nextRows] = await Promise.all([
        loadEventsLive(localOnly),
        loadMyApplicationsLive(user.id, localOnly),
      ]);
      if (!active) return;
      setEvents(nextEvents);
      setRows(nextRows);
    }
    load();
    return () => {
      active = false;
    };
  }, [user.id, localOnly]);

  const upcoming = useMemo(
    () =>
      (rows ?? [])
        .filter((row) => isUpcoming(row, events))
        .sort((a, b) => sessionEnd(a, events) - sessionEnd(b, events)),
    [rows, events],
  );
  const past = useMemo(
    () =>
      (rows ?? [])
        .filter((row) => !isUpcoming(row, events))
        .sort((a, b) => sessionEnd(b, events) - sessionEnd(a, events)),
    [rows, events],
  );

  function askCancel(id: string | null) {
    setConfirmingId(id);
    setReason("");
    setMessage("");
  }

  async function requestCancel(row: Application) {
    if (busy) return;
    const reasonText = reason.trim();
    if (!reasonText) {
      setMessage("キャンセルの理由を書いてください。");
      return;
    }
    setBusy(true);
    setMessage("");
    const event = events.find((item) => item.slug === row.eventSlug);
    try {
      await cancelApplicationLive(row.id, user.id, localOnly);
      await fetch("/api/apply/cancel-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: event?.title ?? row.eventSlug,
          eventSlug: row.eventSlug,
          name: row.name,
          email: row.email,
          partySize: row.partySize,
          sessionLabel: sessionOf(row, events),
          reason: reasonText,
        }),
      });
      await refresh();
      setConfirmingId(null);
      setReason("");
      setMessage("キャンセルを受け付けました。");
    } catch {
      setMessage("キャンセルできませんでした。開催が近い、またはすでに始まっている可能性があります。");
    } finally {
      setBusy(false);
    }
  }

  if (rows === null) {
    return <p className="mt-10 text-sm text-sumi-soft">読み込み中です。</p>;
  }

  return (
    <div className="mt-10 space-y-12">
      {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      <ReservationGroup
        heading="参加予定の催し"
        empty="参加予定の予約はまだありません。"
        rows={upcoming}
        events={events}
        confirmingId={confirmingId}
        reason={reason}
        busy={busy}
        onAskCancel={askCancel}
        onReasonChange={setReason}
        onConfirmCancel={requestCancel}
      />
      <ReservationGroup heading="過去の参加" empty="過去の参加はまだありません。" rows={past} events={events} />
    </div>
  );
}

function ReservationGroup({
  heading,
  empty,
  rows,
  events,
  confirmingId,
  reason,
  busy,
  onAskCancel,
  onReasonChange,
  onConfirmCancel,
}: {
  heading: string;
  empty: string;
  rows: Application[];
  events: EventItem[];
  confirmingId?: string | null;
  reason?: string;
  busy?: boolean;
  onAskCancel?: (id: string | null) => void;
  onReasonChange?: (value: string) => void;
  onConfirmCancel?: (row: Application) => void;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl tracking-wide">{heading}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-sumi-soft">{empty}</p>
      ) : (
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {rows.map((row) => {
            const event = events.find((item) => item.slug === row.eventSlug);
            const cancelled = row.status === "cancelled";
            const canCancel = Boolean(onConfirmCancel) && !cancelled;
            const confirming = confirmingId === row.id;
            return (
              <li key={row.id} className="py-5">
                <p className="text-[11px] tracking-[0.14em] text-tsuchi">
                  {cancelled ? "キャンセル済み" : "予約確定"}
                  <span className="mx-2 text-line">/</span>
                  {event ? eventPathTitle(event, events) : row.eventSlug}
                </p>
                <p className="mt-1 font-serif text-lg tracking-wide">{event?.title ?? row.eventSlug}</p>
                <p className="mt-1 text-sm text-sumi-soft">
                  {row.partySize}名 · {sessionOf(row, events)}
                </p>
                <div className="mt-3 flex gap-4 text-[13px] tracking-[0.14em]">
                  <Link href={`/events/${row.eventSlug}`} className="text-sumi-soft">
                    催し
                  </Link>
                  {canCancel && !confirming ? (
                    <button type="button" className="text-sumi-soft" onClick={() => onAskCancel?.(row.id)}>
                      キャンセルを申請
                    </button>
                  ) : null}
                </div>
                {confirming ? (
                  <div className="mt-4 space-y-4 border border-line bg-kami px-4 py-4">
                    <p className="text-sm leading-7 text-sumi-soft">
                      この予約をキャンセルします。席は空きます。理由は参加作家へ届きます。
                    </p>
                    <Field label="キャンセルの理由">
                      <TextArea
                        value={reason ?? ""}
                        onChange={(e) => onReasonChange?.(e.target.value)}
                        required
                        rows={4}
                        className="min-h-24"
                      />
                    </Field>
                    <div className="flex items-center gap-5">
                      <PrimaryButton type="button" disabled={busy} onClick={() => onConfirmCancel?.(row)}>
                        確定
                      </PrimaryButton>
                      <button
                        type="button"
                        disabled={busy}
                        className="text-[13px] tracking-[0.14em] text-sumi-soft"
                        onClick={() => onAskCancel?.(null)}
                      >
                        もどる
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
