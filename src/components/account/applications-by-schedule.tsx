"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Application } from "@/lib/content/applications";
import {
  eventLineage,
  inferEventKind,
  sessionCapacity,
  type EventItem,
  type EventSession,
} from "@/data/site";
import { formatDateJa, formatSessionRange } from "@/lib/dates";

type SessionGroup = {
  startsAt: string;
  label: string;
  capacity: number | null;
  reserved: Application[];
  cancelled: Application[];
};

type EventGroup = {
  slug: string;
  event?: EventItem;
  sessions: SessionGroup[];
};

type VenueBranch = {
  key: string;
  venue?: EventItem;
  events: EventGroup[];
};

type HostGroup = {
  key: string;
  festival?: EventItem;
  branches: VenueBranch[];
};

function byCreated(a: Application, b: Application) {
  return a.createdAt.localeCompare(b.createdAt);
}

function firstSessionTime(event?: EventItem) {
  const start = event?.sessions[0]?.startsAt;
  if (!start) return Number.POSITIVE_INFINITY;
  return new Date(start).getTime();
}

function byFirstSession(a: EventItem, b: EventItem) {
  return firstSessionTime(a) - firstSessionTime(b);
}

function partyTotal(items: Application[]) {
  return items.reduce((sum, item) => sum + item.partySize, 0);
}

function sessionGroupsFor(
  event: EventItem | undefined,
  applications: Application[],
  includeEmptySessions: boolean,
): SessionGroup[] {
  const byStart = new Map<string, Application[]>();
  for (const row of applications) {
    const list = byStart.get(row.sessionStartsAt) ?? [];
    list.push(row);
    byStart.set(row.sessionStartsAt, list);
  }

  const seen = new Set<string>();
  const sessions: EventSession[] = [];
  if (includeEmptySessions) {
    for (const session of event?.sessions ?? []) {
      if (!session.startsAt || seen.has(session.startsAt)) continue;
      seen.add(session.startsAt);
      sessions.push(session);
    }
  }
  for (const startsAt of byStart.keys()) {
    if (seen.has(startsAt)) continue;
    seen.add(startsAt);
    const matched = event?.sessions.find((item) => item.startsAt === startsAt);
    sessions.push(matched ?? { startsAt, endsAt: startsAt });
  }
  sessions.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return sessions.map((session) => {
    const matched = event?.sessions.find((item) => item.startsAt === session.startsAt);
    const rows = (byStart.get(session.startsAt) ?? []).slice().sort(byCreated);
    return {
      startsAt: session.startsAt,
      label: matched
        ? formatSessionRange(matched.startsAt, matched.endsAt)
        : formatDateJa(session.startsAt),
      capacity: matched && event ? sessionCapacity(matched, event) : null,
      reserved: rows.filter((row) => row.status !== "cancelled"),
      cancelled: rows.filter((row) => row.status === "cancelled"),
    };
  });
}

function nestGroups(groups: EventGroup[], catalog: EventItem[]): HostGroup[] {
  const hosts = new Map<string, { festival?: EventItem; branches: Map<string, VenueBranch> }>();

  const ensure = (key: string, festival?: EventItem) => {
    const current = hosts.get(key);
    if (current) return current;
    const next = { festival, branches: new Map<string, VenueBranch>() };
    hosts.set(key, next);
    return next;
  };

  for (const group of groups) {
    const lineage = group.event ? eventLineage(group.event, catalog) : [];
    const festival = lineage.find((item) => inferEventKind(item, catalog) === "festival");
    const venue = lineage.find((item) => inferEventKind(item, catalog) === "venue");
    const host = ensure(festival?.slug ?? "_none", festival);
    const branchKey = venue?.slug ?? "_direct";
    const branch = host.branches.get(branchKey) ?? { key: branchKey, venue, events: [] };
    branch.events.push(group);
    host.branches.set(branchKey, branch);
  }

  return [...hosts.entries()]
    .sort((a, b) => {
      if (!a[1].festival && b[1].festival) return 1;
      if (a[1].festival && !b[1].festival) return -1;
      return firstSessionTime(a[1].festival) - firstSessionTime(b[1].festival);
    })
    .map(([key, host]) => ({
      key,
      festival: host.festival,
      branches: [...host.branches.values()]
        .sort((a, b) => {
          if (!a.venue && b.venue) return 1;
          if (a.venue && !b.venue) return -1;
          if (a.venue && b.venue) return byFirstSession(a.venue, b.venue);
          return 0;
        })
        .map((branch) => ({
          ...branch,
          events: branch.events.slice().sort((a, b) => {
            if (a.event && b.event) return byFirstSession(a.event, b.event);
            return a.slug.localeCompare(b.slug);
          }),
        })),
    }));
}

export function ApplicationsBySchedule({
  events,
  rows,
  eventSlugs,
  includeEmptySessions = false,
}: {
  events: EventItem[];
  rows: Application[];
  eventSlugs: string[];
  includeEmptySessions?: boolean;
}) {
  const tree = useMemo(() => {
    const byEvent = new Map<string, Application[]>();
    for (const row of rows) {
      const list = byEvent.get(row.eventSlug) ?? [];
      list.push(row);
      byEvent.set(row.eventSlug, list);
    }
    const slugs = [...eventSlugs];
    for (const slug of byEvent.keys()) {
      if (!slugs.includes(slug)) slugs.push(slug);
    }
    const groups = slugs.map((slug) => {
      const event = events.find((item) => item.slug === slug);
      return {
        slug,
        event,
        sessions: sessionGroupsFor(event, byEvent.get(slug) ?? [], includeEmptySessions),
      };
    });
    return nestGroups(groups, events);
  }, [events, rows, eventSlugs, includeEmptySessions]);

  if (tree.length === 0) {
    return <p className="mt-8 text-sm text-sumi-soft">予約はまだありません。</p>;
  }

  return (
    <div className="mt-12 space-y-16">
      {tree.map((host) => (
        <section key={host.key}>
          {host.festival ? (
            <p className="text-[11px] tracking-[0.18em] text-tsuchi">総合開催</p>
          ) : null}
          {host.festival ? (
            <h2 className="mt-2 font-serif text-2xl tracking-wide">{host.festival.title}</h2>
          ) : null}
          <div className={host.festival ? "mt-8 space-y-12" : "space-y-12"}>
            {host.branches.map((branch) => (
              <div key={branch.key} className={host.festival ? "border-l border-line pl-5" : ""}>
                {branch.venue ? (
                  <>
                    <p className="text-[11px] tracking-[0.18em] text-tsuchi">会場</p>
                    <h3 className="mt-2 font-serif text-xl tracking-wide">{branch.venue.title}</h3>
                  </>
                ) : null}
                <div className={branch.venue ? "mt-8 space-y-12" : "space-y-12"}>
                  {branch.events.map((group) => (
                    <EventApplications
                      key={group.slug}
                      group={group}
                      nested={Boolean(host.festival || branch.venue)}
                      indent={Boolean(branch.venue)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventApplications({
  group,
  nested,
  indent,
}: {
  group: EventGroup;
  nested: boolean;
  indent: boolean;
}) {
  const title = group.event?.title ?? group.slug;
  const Heading = nested ? "h3" : "h2";
  return (
    <div className={indent ? "border-l border-line pl-5" : ""}>
      {nested ? <p className="text-[11px] tracking-[0.18em] text-tsuchi">催し</p> : null}
      <Heading className={`${nested ? "mt-2 font-serif text-xl tracking-wide" : "font-serif text-2xl tracking-wide"}`}>
        <Link href={`/events/${group.slug}`}>{title}</Link>
      </Heading>
      {group.sessions.length === 0 ? (
        <p className="mt-4 text-sm text-sumi-soft">日程はまだありません。</p>
      ) : (
        <div className="mt-6 space-y-8">
          {group.sessions.map((session) => (
            <SessionApplications key={session.startsAt} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionApplications({ session }: { session: SessionGroup }) {
  const reservedCount = partyTotal(session.reserved);
  return (
    <div>
      <p className="text-sm tracking-wide text-sumi">{session.label}</p>
      <p className="mt-1 text-[12px] tracking-[0.12em] text-sumi-soft">
        予約 {reservedCount}名
        {session.capacity ? ` / 定員 ${session.capacity}名` : ""}
      </p>

      {session.reserved.length === 0 && session.cancelled.length === 0 ? (
        <p className="mt-3 text-sm text-sumi-soft">予約はまだありません。</p>
      ) : null}

      {session.reserved.length ? (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {session.reserved.map((row) => (
            <GuestRow key={row.id} row={row} />
          ))}
        </ul>
      ) : null}

      {session.cancelled.length ? (
        <div className="mt-5 bg-kami/70 px-4 py-4">
          <p className="text-[11px] tracking-[0.14em] text-sumi-soft">キャンセル</p>
          <ul className="mt-3 space-y-3">
            {session.cancelled.map((row) => (
              <GuestRow key={row.id} row={row} cancelled />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GuestRow({ row, cancelled = false }: { row: Application; cancelled?: boolean }) {
  return (
    <li className={cancelled ? "text-sumi-soft" : "py-3.5"}>
      <p className={cancelled ? "text-sm" : "font-serif text-base tracking-wide"}>
        {row.name}
        <span className="ml-3 text-sm text-sumi-soft">{row.partySize}名</span>
      </p>
      <p className="mt-1 text-sm text-sumi-soft">
        {row.email}
        {row.phone ? ` · ${row.phone}` : ""}
      </p>
      {row.note ? <p className="mt-1 text-sm leading-7 text-sumi-soft">{row.note}</p> : null}
    </li>
  );
}
