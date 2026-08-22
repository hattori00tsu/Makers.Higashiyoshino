"use client";

import { useEffect, useMemo, useState } from "react";
import { ApplicationsBySchedule } from "@/components/account/applications-by-schedule";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { Select } from "@/components/account/fields";
import { loadApplicationsLive, loadEventsLive } from "@/lib/content/live";
import type { Application } from "@/lib/content/applications";
import { needsReservation, type EventItem } from "@/data/site";

function byFirstSession(a: EventItem, b: EventItem) {
  return new Date(a.sessions[0]?.startsAt ?? 0).getTime() - new Date(b.sessions[0]?.startsAt ?? 0).getTime();
}

export default function AdminApplicationsPage() {
  const { ready, user } = useAdmin();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rows, setRows] = useState<Application[]>([]);
  const [filter, setFilter] = useState("all");
  const localOnly = user?.source === "preview";

  useEffect(() => {
    if (!ready) return;
    Promise.all([loadEventsLive(localOnly), loadApplicationsLive(localOnly)]).then(([nextEvents, nextRows]) => {
      setEvents(nextEvents);
      setRows(nextRows);
    });
  }, [ready, localOnly]);

  const listedEvents = useMemo(
    () =>
      events
        .filter((event) => rows.some((row) => row.eventSlug === event.slug) || needsReservation(event))
        .sort(byFirstSession),
    [events, rows],
  );

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.eventSlug === filter)),
    [rows, filter],
  );

  const eventSlugs = useMemo(() => {
    if (filter !== "all") return [filter];
    const withApps = new Set(visible.map((row) => row.eventSlug));
    return listedEvents.filter((event) => withApps.has(event.slug)).map((event) => event.slug);
  }, [filter, listedEvents, visible]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">申込み</h1>
      <AdminNav />
      <p className="mb-8 text-sm leading-7 text-sumi-soft">日程ごとの予約です。申込みが届いた時点で確定しています。</p>

      <div className="max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">すべての催し</option>
          {listedEvents.map((event) => (
            <option key={event.slug} value={event.slug}>
              {event.title}
            </option>
          ))}
        </Select>
      </div>

      {filter === "all" && visible.length === 0 ? (
        <p className="mt-8 text-sm text-sumi-soft">予約はまだありません。</p>
      ) : (
        <ApplicationsBySchedule
          events={events}
          rows={visible}
          eventSlugs={eventSlugs}
          includeEmptySessions={filter !== "all"}
        />
      )}
    </div>
  );
}
