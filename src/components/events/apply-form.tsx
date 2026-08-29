"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Field, PrimaryButton, Select, TextArea, TextInput } from "@/components/account/fields";
import { LoginPanel } from "@/components/auth/login-panel";
import {
  addApplicationLive,
  findEventLive,
  liveSeatKey,
  remainingSeatsLive,
  remainingSeatsMapLive,
} from "@/lib/content/live";
import { eventPriceLabel, isPublished, needsReservation, sessionCapacity, type EventItem } from "@/data/site";
import { formatSessionRange } from "@/lib/dates";
import { localizedEvent, localizedEvents } from "@/lib/i18n/content";
import { useLocale, useMessages } from "@/lib/i18n/provider";
import { useSession } from "@/lib/account/use-session";

type Props = {
  slug: string;
  initial: EventItem | null;
  initialLineage?: EventItem[];
};

export function ApplyForm({ slug, initial, initialLineage = [] }: Props) {
  const { user, loading } = useSession();
  const locale = useLocale();
  const t = useMessages();
  const [fetchedEvent, setFetchedEvent] = useState<EventItem | null>(null);
  const [fetchedLineage, setFetchedLineage] = useState<EventItem[]>([]);
  const event = initial ?? fetchedEvent;
  const lineage = initial ? initialLineage : fetchedLineage;
  const [sessionStartsAt, setSessionStartsAt] = useState(initial?.sessions[0]?.startsAt ?? "");
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leftBySession, setLeftBySession] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (initial) {
      if (initial.sessions[0]) {
        setSessionStartsAt((current) => current || initial.sessions[0].startsAt);
      }
      return;
    }

    let active = true;
    async function load() {
      const next = await findEventLive(slug);
      if (!active) return;
      setFetchedEvent(next ?? null);
      if (!next) {
        setFetchedLineage([]);
        return;
      }
      const chain: EventItem[] = [next];
      let current = next;
      while (current.parentSlug) {
        const parent = await findEventLive(current.parentSlug);
        if (!parent) break;
        chain.unshift(parent);
        current = parent;
      }
      if (active) setFetchedLineage(chain);
      if (next.sessions[0]) {
        setSessionStartsAt((currentSession) => currentSession || next.sessions[0].startsAt);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug, initial]);

  useEffect(() => {
    if (!event) return;
    remainingSeatsMapLive([event]).then(setLeftBySession);
  }, [event]);

  const left =
    event && sessionStartsAt ? (leftBySession[liveSeatKey(event.slug, sessionStartsAt)] ?? null) : null;

  const maxParty = useMemo(() => {
    if (left == null) return 8;
    return Math.max(1, Math.min(8, left));
  }, [left]);

  if (!event) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-28 pb-20">
        <p className="text-sm text-sumi-soft">{locale === "en" ? "Event not found." : "催しが見つかりません。"}</p>
      </div>
    );
  }

  const view = localizedEvent(event, locale);
  const viewLineage = localizedEvents(lineage, locale);

  if (!isPublished(event) || (event.status ?? "published") === "cancelled") {
    return (
      <div className="mx-auto max-w-xl px-5 pt-28 pb-20">
        <p className="text-sm text-sumi-soft">いまは申し込めません。</p>
        <Link href={`/events/${event.slug}`} className="mt-4 inline-block text-sm underline decoration-line underline-offset-4">
          {t.apply.backToEvent}
        </Link>
      </div>
    );
  }

  if (!needsReservation(event)) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-28 pb-20">
        <p className="text-sm leading-7 text-sumi-soft">
          この催しに事前の申込みは不要です。当日、直接お越しください。
        </p>
        <Link href={`/events/${event.slug}`} className="mt-4 inline-block text-sm underline decoration-line underline-offset-4">
          {t.apply.backToEvent}
        </Link>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">APPLY</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">{t.apply.title}</h1>
        <p className="mt-3 font-serif text-lg tracking-wide">{view.title}</p>
        {loading ? (
          <p className="mt-6 text-sm leading-7 text-sumi-soft">{t.common.loading}</p>
        ) : (
          <>
            <p className="mt-6 text-sm leading-7 text-sumi-soft">
              申込みには登録・ログインが必要です。入ったあと、このページで予約できます。
            </p>
            <div className="mt-10">
              <LoginPanel intent="visitor" nextPath={`/events/${slug}/apply`} />
            </div>
          </>
        )}
        <div className="mt-10">
          <Link href={`/events/${event.slug}`} className="text-sm underline decoration-line underline-offset-4">
            {t.apply.backToEvent}
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">APPLY</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">予約が確定しました</h1>
        <p className="mt-6 text-sm leading-7 text-sumi-soft">{message}</p>
        <Link
          href="/visit"
          className="mt-8 inline-block text-sm underline decoration-line underline-offset-4"
        >
          参加予定を見る
        </Link>
        <span className="mx-3 text-line">/</span>
        <Link href={`/events/${event.slug}`} className="text-sm underline decoration-line underline-offset-4">
          {t.apply.backToEvent}
        </Link>
        {event.sessions.length > 1 ? (
          <>
            <span className="mx-3 text-line">/</span>
            <button
              type="button"
              className="text-sm underline decoration-line underline-offset-4"
              onClick={() => {
                setDone(false);
                setMessage("");
              }}
            >
              別の日程を申し込む
            </button>
          </>
        ) : null}
      </div>
    );
  }

  const full = left === 0;

  async function onSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!event || !user || full || busy) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("お名前を入力してください。");
      setConfirming(false);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      setMessage("");
      return;
    }
    const size = Number(partySize) || 1;
    const session = event.sessions.find((item) => item.startsAt === sessionStartsAt) ?? event.sessions[0];
    setBusy(true);
    const remaining = await remainingSeatsLive(
      event.slug,
      sessionCapacity(session, event),
      user.source === "preview",
      sessionStartsAt,
    );
    if (remaining !== null && size > remaining) {
        setMessage(t.apply.remainingSeats(remaining));
      setBusy(false);
      setConfirming(false);
      return;
    }
    try {
      await addApplicationLive(
        {
          eventSlug: event.slug,
          sessionStartsAt,
          name: trimmedName,
          email: user.email,
          phone: "",
          partySize: size,
          note: note.trim(),
          userId: user.id,
        },
        user.source === "preview",
      );
    } catch {
      setMessage(t.apply.failed);
      setBusy(false);
      return;
    }
    let emailed = false;
    try {
      const response = await fetch("/api/apply/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: view.title,
          eventSlug: event.slug,
          name: trimmedName,
          email: user.email,
          partySize: size,
          note: note.trim(),
          locale,
          sessionLabel: formatSessionRange(
            sessionStartsAt,
            event.sessions.find((item) => item.startsAt === sessionStartsAt)?.endsAt ?? sessionStartsAt,
            locale,
          ),
        }),
      });
      const payload = (await response.json()) as { emailed?: boolean };
      emailed = Boolean(payload.emailed);
    } catch {
      emailed = false;
    }
    setMessage(emailed ? t.apply.doneMail : t.apply.doneNoMail);
    setDone(true);
    setBusy(false);
    setConfirming(false);
  }

  return (
    <div className="mx-auto max-w-xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">APPLY</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">{t.apply.title}</h1>
      {viewLineage.length > 0 ? (
        <p className="mt-3 text-sm text-sumi-soft">
          {viewLineage.map((item, index) => (
            <span key={item.slug}>
              {index > 0 ? <span className="mx-2 text-line">/</span> : null}
              <Link href={`/events/${item.slug}`} className="underline decoration-line underline-offset-4">
                {item.title}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
      <p className="mt-3 font-serif text-lg tracking-wide">{view.title}</p>
      {eventPriceLabel(view) ? (
        <p className="mt-2 text-sm text-sumi-soft">{t.apply.price(eventPriceLabel(view))}</p>
      ) : null}
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        {t.apply.lead}
        {(() => {
          const session = event.sessions.find((item) => item.startsAt === sessionStartsAt) ?? event.sessions[0];
          const cap = session ? sessionCapacity(session, event) : null;
          return cap ? t.apply.sessionCapacity(cap, left ?? cap) : "";
        })()}
      </p>

      {full ? (
        <p className="mt-8 border border-line bg-kami px-4 py-4 text-sm leading-7 text-sumi-soft">
          {t.events.full}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          {event.sessions.length > 1 ? (
            <Field label={t.apply.session}>
              <Select
                value={sessionStartsAt}
                onChange={(e) => {
                  setSessionStartsAt(e.target.value);
                  setConfirming(false);
                }}
                required
              >
                {event.sessions.map((session) => {
                  const cap = sessionCapacity(session, event);
                  return (
                    <option key={session.startsAt} value={session.startsAt}>
                      {formatSessionRange(session.startsAt, session.endsAt, locale)}
                      {cap ? t.apply.sessionCapacityShort(cap) : ""}
                    </option>
                  );
                })}
              </Select>
            </Field>
          ) : (
            <p className="text-sm text-sumi-soft">
              {event.sessions[0]
                ? formatSessionRange(event.sessions[0].startsAt, event.sessions[0].endsAt, locale)
                : null}
            </p>
          )}
          <Field label={t.apply.name}>
            <TextInput
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setConfirming(false);
              }}
              required
              autoComplete="name"
            />
          </Field>
          <Field label="メール">
            <p className="border border-transparent py-2.5 text-sm text-sumi">{user.email}</p>
            <p className="text-xs leading-6 text-sumi-soft">登録したメールです。申込み先は変更できません。</p>
          </Field>
          <Field label={t.apply.party}>
            <TextInput
              type="number"
              min={1}
              max={maxParty}
              value={partySize}
              onChange={(e) => {
                setPartySize(e.target.value);
                setConfirming(false);
              }}
              required
            />
          </Field>
          <Field label={t.apply.note}>
            <TextArea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setConfirming(false);
              }}
            />
          </Field>
          {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
          <p className="text-xs leading-6 text-sumi-soft">
            {t.apply.privacyBefore}
            <Link href="/privacy" className="mx-1 underline decoration-line underline-offset-4">
              {t.footer.privacy}
            </Link>
            {t.apply.privacyAfter}
            <Link href="/visit" className="mx-1 underline decoration-line underline-offset-4">
              {t.apply.visit}
            </Link>
            {t.apply.privacyAfter2}
          </p>
          {confirming ? (
            <div className="space-y-4 border border-line bg-kami px-4 py-4">
              <p className="text-sm leading-7 text-sumi-soft">{t.apply.confirm}</p>
              <div className="flex items-center gap-5">
                <PrimaryButton type="submit" disabled={busy}>
                  {busy ? t.apply.applying : t.apply.confirmSubmit}
                </PrimaryButton>
                <button
                  type="button"
                  disabled={busy}
                  className="text-[13px] tracking-[0.14em] text-sumi-soft"
                  onClick={() => setConfirming(false)}
                >
                  {t.apply.back}
                </button>
              </div>
            </div>
          ) : (
            <PrimaryButton type="submit">{t.apply.title}</PrimaryButton>
          )}
        </form>
      )}

      <Link
        href={`/events/${event.slug}`}
        className="mt-10 inline-block text-sm underline decoration-line underline-offset-4"
      >
        催しへ戻る
      </Link>
    </div>
  );
}
