"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Select } from "@/components/account/fields";
import { saveEventLive } from "@/lib/content/live";
import { formatDateJa } from "@/lib/dates";
import { inferEventKind, type EventItem, type PublishStatus } from "@/data/site";

const statusLabel: Record<string, string> = {
  draft: "公開待ち",
  published: "公開",
  cancelled: "中止",
};

type Props = {
  parent: EventItem;
  catalog: EventItem[];
  localOnly?: boolean;
  onChanged: () => void | Promise<void>;
};

function byDate(a: EventItem, b: EventItem) {
  return (
    new Date(a.sessions[0]?.startsAt ?? 0).getTime() -
    new Date(b.sessions[0]?.startsAt ?? 0).getTime()
  );
}

function childrenOf(parentSlug: string, catalog: EventItem[], kind: "venue" | "program") {
  return catalog
    .filter((item) => item.parentSlug === parentSlug && inferEventKind(item, catalog) === kind)
    .sort(byDate);
}

export function EventChildren({ parent, catalog, localOnly, onChanged }: Props) {
  const kind = inferEventKind(parent, catalog);
  if (kind === "program") return null;

  const venues = childrenOf(parent.slug, catalog, "venue");
  const programs = childrenOf(parent.slug, catalog, "program");
  const available = catalog
    .filter((item) => inferEventKind(item, catalog) === "program" && !item.parentSlug)
    .sort(byDate);

  return (
    <section className="space-y-10">
      {kind === "festival" ? (
        <div>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl tracking-wide">会場</h2>
            <Link
              href={`/admin/events/new?kind=venue&parent=${parent.slug}`}
              className="text-[13px] tracking-[0.14em] text-sugi"
            >
              会場を足す
            </Link>
          </div>
          {venues.length === 0 ? (
            <p className="text-sm text-sumi-soft">まだ会場はありません。会場のページから個別の催しを入れられます。</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {venues.map((venue) => {
                const nested = childrenOf(venue.slug, catalog, "program");
                return (
                  <li key={venue.slug} className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-serif text-lg tracking-wide">{venue.title}</p>
                      <Link href={`/admin/events/${venue.slug}`} className="text-[13px] tracking-[0.14em] text-sugi">
                        編集
                      </Link>
                    </div>
                    {nested.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-l border-line pl-4">
                        {nested.map((item) => (
                          <li key={item.slug}>
                            <ProgramRow event={item} localOnly={localOnly} onChanged={onChanged} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-sumi-soft">この会場の催しは、会場のページから入れます。</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div>
        <h2 className="font-serif text-xl tracking-wide">個別の催し</h2>
        <p className="mt-3 text-sm leading-7 text-sumi-soft">
          {kind === "festival"
            ? "この総合開催へ直接入れる催しです。会場ごとの催しは、上の会場ページから入れてください。公開待ちのものは、ここで公開できます。"
            : "この会場に入れる催しです。作家が作った公開待ちも、ここで入れて公開できます。"}
        </p>
        {programs.length === 0 ? (
          <p className="mt-4 text-sm text-sumi-soft">まだ催しはありません。</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {programs.map((item) => (
              <li key={item.slug} className="py-4">
                <ProgramRow event={item} localOnly={localOnly} onChanged={onChanged} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6">
          <Link
            href={`/admin/events/new?kind=program&parent=${parent.slug}`}
            className="text-[13px] tracking-[0.14em] text-sugi"
          >
            新しく作る
          </Link>
        </p>
        <AttachProgram
          parentSlug={parent.slug}
          available={available}
          localOnly={localOnly}
          onChanged={onChanged}
        />
      </div>
    </section>
  );
}

function ProgramRow({
  event,
  localOnly,
  onChanged,
}: {
  event: EventItem;
  localOnly?: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const published = event.status === "published";

  async function setStatus(status: PublishStatus) {
    if (busy) return;
    setBusy(true);
    try {
      await saveEventLive({ ...event, status }, event.slug, localOnly);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] tracking-[0.14em] text-tsuchi">
          {statusLabel[event.status ?? "draft"]}
          <span className="mx-2 text-line">/</span>
          {event.sessions[0] ? formatDateJa(event.sessions[0].startsAt) : "日程未設定"}
        </p>
        <p className="mt-1 text-sm text-sumi">{event.title}</p>
      </div>
      <div className="flex items-center gap-4 text-[13px] tracking-[0.14em]">
        {published ? (
          <button type="button" className="text-sumi-soft" disabled={busy} onClick={() => setStatus("draft")}>
            非公開
          </button>
        ) : (
          <button type="button" className="text-sugi" disabled={busy} onClick={() => setStatus("published")}>
            公開する
          </button>
        )}
        <Link href={`/admin/events/${event.slug}`} className="text-sugi">
          編集
        </Link>
      </div>
    </div>
  );
}

function AttachProgram({
  parentSlug,
  available,
  localOnly,
  onChanged,
}: {
  parentSlug: string;
  available: EventItem[];
  localOnly?: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (available.length === 0) return null;

  async function attach() {
    const event = available.find((item) => item.slug === slug);
    if (!event || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await saveEventLive({ ...event, parentSlug }, event.slug, localOnly);
      setSlug("");
      await onChanged();
    } catch {
      setMessage("入れられませんでした。");
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <div className="mt-8 max-w-md">
      <Field label="既存の催しを入れる">
        <Select value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">選ぶ</option>
          {available.map((item) => (
            <option key={item.slug} value={item.slug}>
              {statusLabel[item.status ?? "draft"]} / {item.title}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          className="text-[13px] tracking-[0.14em] text-sugi disabled:opacity-50"
          disabled={!slug || busy}
          onClick={attach}
        >
          このページに入れる
        </button>
        {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      </div>
    </div>
  );
}
