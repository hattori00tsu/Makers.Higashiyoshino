"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApplicationsBySchedule } from "@/components/account/applications-by-schedule";
import { MypageNav } from "@/components/account/mypage-nav";
import { Select } from "@/components/account/fields";
import { useSession } from "@/lib/account/use-session";
import { artistSlugForUser } from "@/lib/account/local";
import { loadApplicationsForArtistLive } from "@/lib/content/live";
import type { Application } from "@/lib/content/applications";
import { eventsManagedByArtist, needsReservation, type EventItem } from "@/data/site";
import { artistEntryPath } from "@/lib/account/paths";

function byFirstSession(a: EventItem, b: EventItem) {
  return new Date(a.sessions[0]?.startsAt ?? 0).getTime() - new Date(b.sessions[0]?.startsAt ?? 0).getTime();
}

export default function MypageApplicationsPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rows, setRows] = useState<Application[]>([]);
  const [artistSlug, setArtistSlug] = useState("");
  const [filter, setFilter] = useState("all");

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
    }
    load();
  }, [user?.id, user?.artistSlug, user?.artistStatus, user?.source, loading, router]);

  const listedEvents = useMemo(() => {
    const managed = new Set(eventsManagedByArtist(artistSlug, events).map((event) => event.slug));
    return events
      .filter(
        (event) =>
          rows.some((row) => row.eventSlug === event.slug) ||
          (managed.has(event.slug) && needsReservation(event)),
      )
      .sort(byFirstSession);
  }, [artistSlug, events, rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.eventSlug === filter)),
    [rows, filter],
  );

  const eventSlugs = useMemo(() => {
    if (filter !== "all") return [filter];
    const withApps = new Set(visible.map((row) => row.eventSlug));
    return listedEvents.filter((event) => withApps.has(event.slug)).map((event) => event.slug);
  }, [filter, listedEvents, visible]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MYPAGE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">申込み</h1>
      <MypageNav />
      <p className="text-sm leading-7 text-sumi-soft">
        日程ごとの予約です。申込みが届いた時点で確定しています。
      </p>

      <div className="mt-8 max-w-xs">
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
