"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApplicationsBySchedule } from "@/components/account/applications-by-schedule";
import { MypageNav } from "@/components/account/mypage-nav";
import { Select } from "@/components/account/fields";
import { useSession } from "@/lib/account/use-session";
import { artistSlugForUser } from "@/lib/account/local";
import { loadApplicationsForArtistLive, setApplicationNotifyLive } from "@/lib/content/live";
import type { Application } from "@/lib/content/applications";
import { eventsManagedByArtist, needsReservation, type EventItem } from "@/data/site";
import { artistEntryPath } from "@/lib/account/paths";
import { isUpcomingEvent } from "@/lib/calendar";

type Scope = "upcoming" | "archive";

function byFirstSession(a: EventItem, b: EventItem) {
  return new Date(a.sessions[0]?.startsAt ?? 0).getTime() - new Date(b.sessions[0]?.startsAt ?? 0).getTime();
}

function byLastSessionDesc(a: EventItem, b: EventItem) {
  const aEnd = new Date(a.sessions[a.sessions.length - 1]?.endsAt ?? a.sessions[0]?.startsAt ?? 0).getTime();
  const bEnd = new Date(b.sessions[b.sessions.length - 1]?.endsAt ?? b.sessions[0]?.startsAt ?? 0).getTime();
  return bEnd - aEnd;
}

export default function MypageApplicationsPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rows, setRows] = useState<Application[]>([]);
  const [notifyBySlug, setNotifyBySlug] = useState<Record<string, boolean>>({});
  const [artistSlug, setArtistSlug] = useState("");
  const [scope, setScope] = useState<Scope>("upcoming");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(artistEntryPath("/mypage/applications"));
      return;
    }
    if (user.artistStatus === "none") {
      router.replace(artistEntryPath());
      return;
    }
    async function load() {
      if (!user) return;
      const localOnly = user.source === "preview";
      const slug = artistSlugForUser(user);
      if (!slug) return;
      const next = await loadApplicationsForArtistLive(slug, localOnly);
      setArtistSlug(slug);
      setEvents(next.events);
      setRows(next.applications);
      setNotifyBySlug(next.notifyBySlug);
    }
    load();
  }, [user?.id, user?.artistSlug, user?.artistStatus, user?.source, loading, router]);

  const listedEvents = useMemo(() => {
    const managed = new Set(eventsManagedByArtist(artistSlug, events).map((event) => event.slug));
    return events.filter(
      (event) =>
        rows.some((row) => row.eventSlug === event.slug) ||
        (managed.has(event.slug) && needsReservation(event)),
    );
  }, [artistSlug, events, rows]);

  const scopedEvents = useMemo(() => {
    const items = listedEvents.filter((event) =>
      scope === "upcoming" ? isUpcomingEvent(event) : !isUpcomingEvent(event),
    );
    return items.sort(scope === "upcoming" ? byFirstSession : byLastSessionDesc);
  }, [listedEvents, scope]);

  const scopedSlugs = useMemo(() => new Set(scopedEvents.map((event) => event.slug)), [scopedEvents]);

  const visible = useMemo(
    () =>
      rows.filter(
        (row) => scopedSlugs.has(row.eventSlug) && (filter === "all" || row.eventSlug === filter),
      ),
    [rows, scopedSlugs, filter],
  );

  const eventSlugs = useMemo(() => {
    if (filter !== "all") return [filter];
    if (scope === "upcoming") return scopedEvents.map((event) => event.slug);
    const withApps = new Set(visible.map((row) => row.eventSlug));
    return scopedEvents.filter((event) => withApps.has(event.slug)).map((event) => event.slug);
  }, [filter, scope, scopedEvents, visible]);

  function changeScope(next: Scope) {
    setScope(next);
    setFilter("all");
    setMessage("");
  }

  async function onNotifyChange(eventSlug: string, notify: boolean) {
    if (!user || !artistSlug) return;
    const previous = notifyBySlug[eventSlug] !== false;
    setNotifyBySlug((current) => ({ ...current, [eventSlug]: notify }));
    setMessage("");
    try {
      await setApplicationNotifyLive(artistSlug, eventSlug, notify, user.source === "preview");
    } catch {
      setNotifyBySlug((current) => ({ ...current, [eventSlug]: previous }));
      setMessage("通知の設定を保存できませんでした。");
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  const empty =
    scope === "upcoming" ? "開催予定の催しはありません。" : "開催済みの予約はありません。";

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">申込み</h1>
      <MypageNav />
      <p className="text-sm leading-7 text-sumi-soft">
        日程ごとの予約です。申込みが届いた時点で確定しています。開催予定の催しでは、申込みのメール通知を催しごと・つくり手ごとに選べます。
      </p>

      <div className="mt-8 flex gap-1 text-[13px] tracking-[0.16em]">
        <button
          type="button"
          onClick={() => changeScope("upcoming")}
          className={`px-3 py-2 ${scope === "upcoming" ? "text-sumi" : "text-sumi-soft"}`}
        >
          開催予定
        </button>
        <span className="self-center text-line">/</span>
        <button
          type="button"
          onClick={() => changeScope("archive")}
          className={`px-3 py-2 ${scope === "archive" ? "text-sumi" : "text-sumi-soft"}`}
        >
          開催済み
        </button>
      </div>

      <div className="mt-4 max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">すべての催し</option>
          {scopedEvents.map((event) => (
            <option key={event.slug} value={event.slug}>
              {event.title}
            </option>
          ))}
        </Select>
      </div>

      {message ? <p className="mt-6 text-sm text-sumi-soft">{message}</p> : null}

      {eventSlugs.length === 0 ? (
        <p className="mt-8 text-sm text-sumi-soft">{empty}</p>
      ) : (
        <ApplicationsBySchedule
          events={events}
          rows={visible}
          eventSlugs={eventSlugs}
          includeEmptySessions={filter !== "all"}
          notifyBySlug={scope === "upcoming" ? notifyBySlug : undefined}
          onNotifyChange={scope === "upcoming" ? onNotifyChange : undefined}
        />
      )}
    </div>
  );
}
