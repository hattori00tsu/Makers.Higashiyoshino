"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Field,
  PrimaryButton,
  Select,
  CompactSelect,
  TextArea,
  TextInput,
} from "@/components/account/fields";
import { blobToDataUrl, compressImage } from "@/lib/image/compress";
import { linkableArtistsLive, loadEventOptions, loadEventsLive } from "@/lib/content/live";
import { defaultEventOptions } from "@/lib/content/options";
import {
  defaultEventImage,
  eventKindLabel,
  eventLineage,
  inferEventKind,
  maxEventGallery,
  validParentCandidates,
  type EventItem,
  type EventKind,
  type PlaceOption,
  type PublishStatus,
} from "@/data/site";
import {
  dayOptions,
  emptySessionClock,
  hourOptions,
  isAllDayRange,
  minutesFor,
  monthOptions,
  sessionClockFromIso,
  sessionClockToIso,
  yearOptions,
  type SessionClock,
} from "@/lib/dates";

const statuses: PublishStatus[] = ["draft", "published", "cancelled"];
const statusLabel: Record<PublishStatus, string> = {
  draft: "下書き",
  published: "公開",
  cancelled: "中止",
};

type Props = {
  initial?: EventItem;
  catalog?: EventItem[];
  people?: { slug: string; name: string; genre: string }[];
  submitLabel: string;
  localOnly?: boolean;
  mode?: "admin" | "artist";
  ownerArtistSlug?: string;
  onSave: (event: EventItem, previousSlug?: string) => void | Promise<void>;
};

const kinds: EventKind[] = ["festival", "venue", "program"];

export function emptyEvent(kind: EventKind = "program"): EventItem {
  return {
    slug: "",
    title: "",
    categories: [],
    summary: "",
    description: "",
    venues: [],
    access: "",
    parkings: [],
    image: "",
    gallery: [],
    price: "",
    isOutdoor: false,
    capacity: null,
    requiresReservation: false,
    status: "draft",
    sessions: [{ startsAt: "", endsAt: "" }],
    artistSlugs: [],
    parentSlug: undefined,
    allDay: kind === "festival",
    kind,
    series: undefined,
    i18nEnabled: false,
    titleEn: "",
    summaryEn: "",
    descriptionEn: "",
    accessEn: "",
    priceEn: "",
  };
}

export function EventEditor({
  initial,
  catalog: catalogProp,
  people: peopleProp,
  submitLabel,
  localOnly,
  mode = "admin",
  ownerArtistSlug,
  onSave,
}: Props) {
  const source = initial ?? emptyEvent();
  const artistMode = mode === "artist";
  const [title, setTitle] = useState(source.title);
  const [slug, setSlug] = useState(source.slug);
  const [categories, setCategories] = useState<string[]>(source.categories);
  const [status, setStatus] = useState<PublishStatus>(source.status ?? "draft");
  const [summary, setSummary] = useState(source.summary);
  const [description, setDescription] = useState(source.description);
  const [venues, setVenues] = useState<PlaceOption[]>(source.venues ?? []);
  const [access, setAccess] = useState(source.access);
  const [parkings, setParkings] = useState<PlaceOption[]>(source.parkings ?? []);
  const [image, setImage] = useState(source.image);
  const [gallery, setGallery] = useState<string[]>(source.gallery ?? []);
  const [price, setPrice] = useState(source.price ?? "");
  const [isOutdoor, setIsOutdoor] = useState(source.isOutdoor);
  const [requiresReservation, setRequiresReservation] = useState(
    source.requiresReservation ?? Boolean(source.capacity || source.sessions.some((session) => session.capacity)),
  );
  const [kind, setKind] = useState<EventKind>(source.kind ?? (source.allDay ? "festival" : "program"));
  const [sessions, setSessions] = useState<SessionClock[]>(
    source.sessions.some((session) => session.startsAt)
      ? source.sessions.map((session) =>
          sessionClockFromIso(session.startsAt, session.endsAt, session.capacity ?? source.capacity),
        )
      : [emptySessionClock(kind === "festival")],
  );
  const [artistSlugs, setArtistSlugs] = useState(source.artistSlugs);
  const [parentSlug, setParentSlug] = useState(source.parentSlug ?? "");
  const [series, setSeries] = useState(source.series ?? "");
  const [i18nEnabled, setI18nEnabled] = useState(Boolean(source.i18nEnabled));
  const [titleEn, setTitleEn] = useState(source.titleEn ?? "");
  const [summaryEn, setSummaryEn] = useState(source.summaryEn ?? "");
  const [descriptionEn, setDescriptionEn] = useState(source.descriptionEn ?? "");
  const [accessEn, setAccessEn] = useState(source.accessEn ?? "");
  const [priceEn, setPriceEn] = useState(source.priceEn ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const slugLock = useRef(source.slug);
  const [peopleFetched, setPeopleFetched] = useState<{ slug: string; name: string; genre: string }[]>([]);
  const [catalogFetched, setCatalogFetched] = useState<EventItem[]>([]);
  const [options, setOptions] = useState(defaultEventOptions());
  const people = peopleProp ?? peopleFetched;
  const catalog = catalogProp ?? catalogFetched;
  const hasCatalogProp = catalogProp !== undefined;
  const hasPeopleProp = peopleProp !== undefined;

  useEffect(() => {
    if (!hasPeopleProp) linkableArtistsLive(localOnly).then(setPeopleFetched);
    if (!hasCatalogProp) loadEventsLive(localOnly).then(setCatalogFetched);
    loadEventOptions(localOnly).then(setOptions);
  }, [localOnly, hasCatalogProp, hasPeopleProp]);

  const parentOptions = useMemo(() => {
    const current: EventItem = {
      ...source,
      slug: source.slug || slugLock.current || "__new__",
      parentSlug: parentSlug || undefined,
      kind,
    };
    const withCurrent = catalog.some((item) => item.slug === current.slug)
      ? catalog.map((item) => (item.slug === current.slug ? current : item))
      : [...catalog, current];
    return validParentCandidates(current, withCurrent);
  }, [catalog, parentSlug, source, kind]);

  const festivalParents = parentOptions.filter((item) => inferEventKind(item, catalog) === "festival");
  const venueParents = parentOptions.filter((item) => inferEventKind(item, catalog) === "venue");
  const dateOnly = kind === "festival";
  const optionsHref = artistMode ? undefined : "/admin/options";

  function sessionIsAllDay(session: SessionClock) {
    return dateOnly || (kind === "venue" && Boolean(session.allDay));
  }

  function applyKind(next: EventKind) {
    setKind(next);
    if (next === "festival") {
      setParentSlug("");
      setRequiresReservation(false);
      setSessions((current) => current.map((session) => ({ ...session, capacity: "", allDay: true })));
    } else if (next === "venue") {
      setRequiresReservation(false);
      setSessions((current) => current.map((session) => ({ ...session, capacity: "" })));
    } else {
      setSessions((current) => current.map((session) => ({ ...session, allDay: false })));
    }
  }

  function setSessionAllDay(index: number, allDay: boolean) {
    setSessions((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        if (allDay) {
          return {
            ...item,
            allDay: true,
            endYear: item.endYear || item.year,
            endMonth: item.endMonth || item.month,
            endDay: item.endDay || item.day,
          };
        }
        const wasMidnightSpan = item.startHour === "00" && item.endHour === "23";
        return {
          ...item,
          allDay: false,
          startHour: wasMidnightSpan ? "10" : item.startHour,
          startMinute: wasMidnightSpan ? "00" : item.startMinute,
          endHour: wasMidnightSpan ? "16" : item.endHour,
          endMinute: wasMidnightSpan ? "00" : item.endMinute,
        };
      }),
    );
  }

  function toggleArtist(value: string) {
    setArtistSlugs((current) =>
      current.includes(value) ? current.filter((slugValue) => slugValue !== value) : [...current, value],
    );
  }

  function toggleCategory(value: string) {
    setCategories((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function togglePlace(list: PlaceOption[], setList: (next: PlaceOption[]) => void, item: PlaceOption) {
    const selected = list.some((row) => row.id === item.id);
    setList(selected ? list.filter((row) => row.id !== item.id) : [...list, item]);
  }

  function patchSession(index: number, patch: Partial<SessionClock>) {
    setSessions((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function onImage(file?: File) {
    if (!file) return;
    const local = URL.createObjectURL(file);
    setImage(local);
    try {
      const blob = await compressImage(file);
      const dataUrl = await blobToDataUrl(blob);
      setImage(dataUrl);
      window.setTimeout(() => URL.revokeObjectURL(local), 1500);
    } catch {
      setMessage("画像を読み込めませんでした。");
      URL.revokeObjectURL(local);
    }
  }

  async function onGallery(file?: File) {
    if (!file) return;
    if (gallery.length >= maxEventGallery) {
      setMessage("ギャラリーは4枚までです。");
      return;
    }
    const local = URL.createObjectURL(file);
    setGallery((current) => (current.length >= maxEventGallery ? current : [...current, local]));
    try {
      const blob = await compressImage(file);
      const dataUrl = await blobToDataUrl(blob);
      setGallery((current) => current.map((src) => (src === local ? dataUrl : src)));
      window.setTimeout(() => URL.revokeObjectURL(local), 1500);
    } catch {
      setGallery((current) => current.filter((src) => src !== local));
      setMessage("画像を読み込めませんでした。");
      URL.revokeObjectURL(local);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    if (categories.length === 0) {
      setMessage("種別をひとつ以上選んでください。");
      return;
    }
    if (kind !== "program" && !artistMode && venues.length === 0) {
      setMessage("会場をひとつ以上選んでください。");
      return;
    }
    const parsedSessions = sessions
      .map((session) => {
        const next = sessionClockToIso(session, sessionIsAllDay(session));
        if (!next) return null;
        const capacity =
          kind === "program" && requiresReservation ? next.capacity : null;
        return { startsAt: next.startsAt, endsAt: next.endsAt, capacity };
      })
      .filter((session): session is { startsAt: string; endsAt: string; capacity: number | null } =>
        Boolean(session),
      );
    if (parsedSessions.length === 0) {
      setMessage(
        kind === "venue"
          ? "詳細な日程または終日日程をひとつ以上入れてください。"
          : dateOnly
            ? "開始と終了の日付を入れてください。終了は開始と同じ日か、それ以降にしてください。"
            : "詳細な日程をひとつ以上入れてください。",
      );
      return;
    }
    if (image.startsWith("blob:") || gallery.some((src) => src.startsWith("blob:"))) {
      setMessage("画像の処理が終わるまで待ってください。");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setMessage("");
    const nextSlug = slug.trim() || slugLock.current || `event-${Date.now().toString(36)}`;
    slugLock.current = nextSlug;
    if (!slug.trim()) setSlug(nextSlug);
    const nextKind: EventKind = artistMode ? "program" : kind;
    const nextStatus: PublishStatus = artistMode ? (initial?.status ?? "draft") : status;
    const nextParent = artistMode
      ? initial?.parentSlug
      : nextKind === "festival"
        ? undefined
        : parentSlug || undefined;
    const self = artistMode ? ownerArtistSlug || "" : "";
    const linkedArtists = artistMode
      ? Array.from(new Set([...(self ? [self] : []), ...artistSlugs]))
      : artistSlugs;
    try {
      await onSave(
        {
          slug: nextSlug,
          title,
          categories,
          summary,
          description,
          venues: nextKind === "program" ? [] : venues,
          access,
          parkings: nextKind === "program" ? [] : parkings,
          image: image.trim() && image !== defaultEventImage && !image.startsWith("blob:") ? image : "",
          gallery: gallery
            .map((src) => src.trim())
            .filter((src) => src && src !== defaultEventImage && !src.startsWith("blob:"))
            .slice(0, maxEventGallery),
          price: price.trim(),
          isOutdoor,
          capacity: parsedSessions.reduce<number | null>(
            (max, session) =>
              session.capacity && (max == null || session.capacity > max) ? session.capacity : max,
            null,
          ),
          requiresReservation: nextKind === "program" && requiresReservation,
          status: nextStatus,
          sessions: parsedSessions,
          artistSlugs: linkedArtists,
          parentSlug: nextParent,
          series: series.trim() || undefined,
          allDay:
            nextKind === "festival" ||
            (nextKind === "venue" &&
              parsedSessions.length > 0 &&
              parsedSessions.every((session) => isAllDayRange(session.startsAt, session.endsAt))),
          kind: nextKind,
          ownerArtistSlug: artistMode
            ? initial?.ownerArtistSlug || self || undefined
            : initial?.ownerArtistSlug,
          i18nEnabled,
          titleEn: titleEn.trim(),
          summaryEn: summaryEn.trim(),
          descriptionEn: descriptionEn.trim(),
          accessEn: accessEn.trim(),
          priceEn: priceEn.trim(),
        },
        initial?.slug,
      );
      setMessage(
        artistMode
          ? "保存しました。公開は運営の承認後にサイトへ出ます。"
          : "保存しました。公開カレンダーに反映されます。",
      );
    } catch {
      savingRef.current = false;
      setSaving(false);
      setMessage("保存できませんでした。");
    }
  }

  const preview = image.trim() && image !== defaultEventImage ? image : "";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="タイトル">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="公開URL">
          <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="autumn-fair" />
        </Field>
        <div className="md:col-span-2">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <p className="text-[12px] tracking-[0.14em] text-sumi-soft">種別（複数可）</p>
            {optionsHref ? (
              <Link href={optionsHref} className="text-[12px] tracking-[0.12em] text-sugi">
                項目を編集
              </Link>
            ) : null}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {options.categories.map((item) => (
              <li key={item}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={categories.includes(item)}
                    onChange={() => toggleCategory(item)}
                  />
                  {item}
                </label>
              </li>
            ))}
          </ul>
          {options.categories.length === 0 ? (
            <p className="text-sm text-sumi-soft">先に項目ページで種別を追加してください。</p>
          ) : null}
        </div>
        {artistMode ? (
          <>
            <p className="md:col-span-2 text-sm leading-7 text-sumi-soft">
              個別の催しとして保存します。総合開催・会場への配置と公開は、運営が行います。
            </p>
            <div className="md:col-span-2">
              <Field label="シリーズ（任意）">
                <Select value={series} onChange={(e) => setSeries(e.target.value)}>
                  <option value="">なし</option>
                  {[...new Set([...options.series, series].filter(Boolean))].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="mt-2 text-xs leading-6 text-sumi-soft">
                毎年続く催しにつけます。年号は入れず、同じ名前を選びます。追加は運営が項目から行います。
              </p>
            </div>
          </>
        ) : (
          <>
            <Field label="公開状態">
              <Select value={status} onChange={(e) => setStatus(e.target.value as PublishStatus)}>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {statusLabel[item]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="種別">
              <Select
                value={kind}
                onChange={(e) => applyKind(e.target.value as EventKind)}
                disabled={Boolean(initial?.slug)}
              >
                {kinds.map((item) => (
                  <option key={item} value={item}>
                    {eventKindLabel(item)}
                  </option>
                ))}
              </Select>
            </Field>
            {kind !== "festival" ? (
              <div className="md:col-span-2">
                <Field label={kind === "venue" ? "所属する総合開催（任意）" : "所属する総合開催／会場（任意）"}>
                  <Select
                    value={parentSlug}
                    onChange={(e) => {
                      const value = e.target.value;
                      setParentSlug(value);
                      const parent = catalog.find((item) => item.slug === value);
                      if (parent && sessions.every((session) => !session.year && !session.month && !session.day)) {
                        setSessions(
                          parent.sessions.map((session) =>
                            sessionClockFromIso(session.startsAt, session.endsAt, session.capacity),
                          ),
                        );
                        if (kind !== "program") {
                          if (venues.length === 0) setVenues(parent.venues);
                          if (parkings.length === 0) setParkings(parent.parkings);
                        }
                        if (!access) setAccess(parent.access);
                      }
                    }}
                  >
                    <option value="">{kind === "venue" ? "なし（単独の会場）" : "なし（単独の催し）"}</option>
                    {festivalParents.length > 0 ? (
                      <optgroup label="総合開催">
                        {festivalParents.map((item) => (
                          <option key={item.slug} value={item.slug}>
                            {item.title}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    {kind === "program" && venueParents.length > 0 ? (
                      <optgroup label="会場">
                        {venueParents.map((item) => {
                          const parentTitle = eventLineage(item, catalog)[0]?.title;
                          return (
                            <option key={item.slug} value={item.slug}>
                              {parentTitle ? `${parentTitle} / ${item.title}` : item.title}
                            </option>
                          );
                        })}
                      </optgroup>
                    ) : null}
                  </Select>
                </Field>
                <p className="mt-2 text-xs leading-6 text-sumi-soft">
                  {kind === "venue"
                    ? "会場は単独でも公開できます。総合開催の下に置くこともできます。日程は、時刻つきの詳細な枠と、総合開催と同じ終日枠の両方を使えます。"
                    : "作家が作った催しは、このページか会場のページから入れて公開します。"}
                </p>
              </div>
            ) : (
              <p className="md:col-span-2 text-sm leading-7 text-sumi-soft">
                総合開催は日付だけの枠です。下の一覧から会場と個別の催しを入れ、公開を承認します。
              </p>
            )}
            <div className="md:col-span-2">
              <Field label="シリーズ（任意）">
                <Select value={series} onChange={(e) => setSeries(e.target.value)}>
                  <option value="">なし</option>
                  {[...new Set([...options.series, series].filter(Boolean))].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="mt-2 text-xs leading-6 text-sumi-soft">
                毎年続く開催につけます。年号は入れず、同じ名前を選びます。追加は
                {optionsHref ? (
                  <Link href={optionsHref} className="mx-1 underline decoration-line underline-offset-4">
                    項目
                  </Link>
                ) : (
                  "運営の項目"
                )}
                から行います。
              </p>
            </div>
          </>
        )}
      </div>

      <Field label="短い紹介">
        <TextInput value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <div>
        <Field label="料金">
          <TextInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="無料、2,000円、材料費実費 など"
          />
        </Field>
        <p className="mt-2 text-xs leading-6 text-sumi-soft">空欄なら公開ページには出しません。</p>
      </div>
      <Field label="本文">
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div className="space-y-4 border-t border-line pt-6">
        <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
          <input
            type="checkbox"
            className="mt-1.5"
            checked={i18nEnabled}
            onChange={(e) => setI18nEnabled(e.target.checked)}
          />
          <span>
            英語の文章を公開する
            <span className="block text-xs leading-6">英語版に切り替えたときに出します。空の項目は日本語のままです。</span>
          </span>
        </label>
        {i18nEnabled ? (
          <div className="space-y-4">
            <Field label="タイトル（英語）">
              <TextInput value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </Field>
            <Field label="短い紹介（英語）">
              <TextInput value={summaryEn} onChange={(e) => setSummaryEn(e.target.value)} />
            </Field>
            <Field label="料金（英語）">
              <TextInput
                value={priceEn}
                onChange={(e) => setPriceEn(e.target.value)}
                placeholder="Free, ¥2,000, materials at cost"
              />
            </Field>
            <Field label="本文（英語）">
              <TextArea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[12px] tracking-[0.14em] text-sumi-soft">
            {kind === "venue"
              ? "日程（詳細な時刻、または総合開催と同じ終日）"
              : dateOnly
                ? "期間（yyyy/mm/dd・複数可）"
                : "詳細な日程（yyyy/mm/dd・24時間制・複数可）"}
          </p>
        </div>
        {kind === "venue" ? (
          <p className="mb-3 text-xs leading-6 text-sumi-soft">
            個別の催しと同じ時刻つきの枠と、総合開催と同じ日付だけの終日枠を、どちらも入れられます。
          </p>
        ) : null}
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const allDaySession = sessionIsAllDay(session);
            return (
              <div key={index} className="space-y-3 border border-line px-3 py-3">
                {kind === "venue" ? (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`venue-session-mode-${index}`}
                        checked={!session.allDay}
                        onChange={() => setSessionAllDay(index, false)}
                      />
                      詳細な日程
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`venue-session-mode-${index}`}
                        checked={Boolean(session.allDay)}
                        onChange={() => setSessionAllDay(index, true)}
                      />
                      終日日程
                    </label>
                  </div>
                ) : null}
                {allDaySession ? (
                  <>
                    <YmdFields
                      label="開始"
                      year={session.year}
                      month={session.month}
                      day={session.day}
                      onChange={(next) => patchSession(index, next)}
                    />
                    <YmdFields
                      label="終了"
                      year={session.endYear}
                      month={session.endMonth}
                      day={session.endDay}
                      onChange={(next) =>
                        patchSession(index, {
                          endYear: next.year,
                          endMonth: next.month,
                          endDay: next.day,
                        })
                      }
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-sm text-sumi-soft"
                        onClick={() => setSessions((current) => current.filter((_, i) => i !== index))}
                      >
                        削除
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <YmdFields
                      label="日付"
                      year={session.year}
                      month={session.month}
                      day={session.day}
                      onChange={(next) => patchSession(index, next)}
                    />
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
                      <ClockSelect
                        label="開始"
                        hour={session.startHour}
                        minute={session.startMinute}
                        onHour={(startHour) => patchSession(index, { startHour })}
                        onMinute={(startMinute) => patchSession(index, { startMinute })}
                      />
                      <p className="hidden self-end pb-2.5 text-sm text-sumi-soft sm:block">–</p>
                      <ClockSelect
                        label="終了"
                        hour={session.endHour}
                        minute={session.endMinute}
                        onHour={(endHour) => patchSession(index, { endHour })}
                        onMinute={(endMinute) => patchSession(index, { endMinute })}
                      />
                      <button
                        type="button"
                        className="self-end pb-2.5 text-left text-sm text-sumi-soft"
                        onClick={() => setSessions((current) => current.filter((_, i) => i !== index))}
                      >
                        削除
                      </button>
                    </div>
                    {kind === "program" && requiresReservation ? (
                      <Field label="この日程の参加可能人数（空欄で定員なし）">
                        <TextInput
                          value={session.capacity}
                          onChange={(e) => patchSession(index, { capacity: e.target.value })}
                          inputMode="numeric"
                        />
                      </Field>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {kind === "venue" ? (
          <div className="mt-3 flex flex-wrap gap-4">
            <button
              type="button"
              className="text-[13px] tracking-[0.14em] text-sugi"
              onClick={() => setSessions((current) => [...current, emptySessionClock(false)])}
            >
              詳細な日程を足す
            </button>
            <button
              type="button"
              className="text-[13px] tracking-[0.14em] text-sugi"
              onClick={() => setSessions((current) => [...current, emptySessionClock(true)])}
            >
              終日日程を足す
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mt-3 text-[13px] tracking-[0.14em] text-sugi"
            onClick={() => setSessions((current) => [...current, emptySessionClock(dateOnly)])}
          >
            {dateOnly ? "期間を足す" : "日程を足す"}
          </button>
        )}
      </div>

      {kind !== "program" ? (
        <PlaceChecklist
          label="会場（複数可）"
          items={options.venues}
          selected={venues}
          editHref={optionsHref}
          onToggle={(item) => togglePlace(venues, setVenues, item)}
        />
      ) : (
        <p className="text-sm leading-7 text-sumi-soft">
          会場と駐車場は、所属する会場の案内を使います。
        </p>
      )}
      <Field label="アクセス">
        <TextArea value={access} onChange={(e) => setAccess(e.target.value)} />
      </Field>
      {i18nEnabled ? (
        <Field label="アクセス（英語）">
          <TextArea value={accessEn} onChange={(e) => setAccessEn(e.target.value)} />
        </Field>
      ) : null}
      {kind !== "program" ? (
        <PlaceChecklist
          label="駐車場（複数可）"
          items={options.parkings}
          selected={parkings}
          editHref={optionsHref}
          onToggle={(item) => togglePlace(parkings, setParkings, item)}
        />
      ) : null}

      {kind === "program" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3 pt-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isOutdoor} onChange={(e) => setIsOutdoor(e.target.checked)} />
              屋外（天候を表示）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={requiresReservation}
                onChange={(e) => {
                  setRequiresReservation(e.target.checked);
                  if (!e.target.checked) {
                    setSessions((current) => current.map((session) => ({ ...session, capacity: "" })));
                  }
                }}
              />
              予約が必要
            </label>
            {requiresReservation ? (
              <p className="text-xs leading-6 text-sumi-soft">参加可能人数は、上の各日程に入れてください。</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="pt-1 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isOutdoor} onChange={(e) => setIsOutdoor(e.target.checked)} />
            屋外（天候を表示）
          </label>
        </div>
      )}

      <div>
        <p className="mb-3 text-[12px] tracking-[0.14em] text-sumi-soft">サムネイル（1枚）</p>
        <p className="mb-3 text-xs leading-6 text-sumi-soft">
          一覧と、個別ページのヘッダーに使います。
        </p>
        <div className="relative aspect-[16/10] w-full max-w-md overflow-hidden border border-line bg-kami">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="催しのサムネイル" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-[12px] tracking-[0.14em] text-sumi-soft">サムネイルをアップロード</span>
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            onChange={(e) => onImage(e.target.files?.[0])}
          />
        </label>
        {preview ? (
          <button
            type="button"
            className="mt-2 text-[13px] tracking-[0.14em] text-sumi-soft"
            onClick={() => setImage("")}
          >
            画像を外す
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-3 text-[12px] tracking-[0.14em] text-sumi-soft">
          ギャラリー（{gallery.length}/{maxEventGallery}）
        </p>
        <p className="mb-3 text-xs leading-6 text-sumi-soft">
          個別ページの中央に、横スクロールで出ます。4枚までです。
        </p>
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {gallery.map((src, index) => (
            <li key={`${src}-${index}`} className="w-28 shrink-0">
              <div className="relative aspect-square overflow-hidden border border-line bg-kami">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`ギャラリー ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <button
                type="button"
                className="mt-2 text-[12px] tracking-wide text-sumi-soft"
                onClick={() => setGallery((current) => current.filter((_, i) => i !== index))}
              >
                外す
              </button>
            </li>
          ))}
          {gallery.length < maxEventGallery ? (
            <li className="w-28 shrink-0">
              <label className="flex aspect-square cursor-pointer items-center justify-center border border-dashed border-line text-center text-[12px] leading-5 tracking-wide text-sumi-soft">
                追加
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    onGallery(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </li>
          ) : null}
        </ul>
      </div>

      {kind === "program" ? (
        <div>
          <p className="mb-3 text-[12px] tracking-[0.14em] text-sumi-soft">参加つくり手</p>
          {artistMode ? (
            <p className="text-sm leading-7 text-sumi-soft">
              参加つくり手として、この催しにあなたの名前が載ります。申込みの管理と通知も、参加つくり手が担当します。
            </p>
          ) : (
            <>
              <ul className="grid gap-2 sm:grid-cols-2">
                {people.map((artist) => (
                  <li key={artist.slug}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={artistSlugs.includes(artist.slug)}
                        onChange={() => toggleArtist(artist.slug)}
                      />
                      {artist.name}
                      <span className="text-sumi-soft">/{artist.genre}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-6 text-sumi-soft">
                参加つくり手は、運営と同じく催しを編集できます。申込みの管理と通知先にもなります。
              </p>
            </>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "保存しています" : submitLabel}
        </PrimaryButton>
        {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      </div>
    </form>
  );
}

function PlaceChecklist({
  label,
  items,
  selected,
  onToggle,
  editHref,
}: {
  label: string;
  items: PlaceOption[];
  selected: PlaceOption[];
  onToggle: (item: PlaceOption) => void;
  editHref?: string;
}) {
  const selectedIds = new Set(selected.map((item) => item.id));
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-[12px] tracking-[0.14em] text-sumi-soft">{label}</p>
        {editHref ? (
          <Link href={editHref} className="text-[12px] tracking-[0.12em] text-sugi">
            項目を編集
          </Link>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-sumi-soft">先に項目ページで追加してください。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggle(item)}
                />
                <span>
                  {item.title}
                  {item.url ? (
                    <span className="ml-2 text-[12px] text-sumi-soft">リンクあり</span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function YmdFields({
  label,
  year,
  month,
  day,
  onChange,
}: {
  label: string;
  year: string;
  month: string;
  day: string;
  onChange: (next: { year: string; month: string; day: string }) => void;
}) {
  const days = dayOptions(year, month);
  function patch(next: Partial<{ year: string; month: string; day: string }>) {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const available = dayOptions(nextYear, nextMonth);
    const requested = next.day ?? day;
    onChange({
      year: nextYear,
      month: nextMonth,
      day: available.includes(requested) ? requested : "",
    });
  }
  return (
    <div>
      <p className="mb-2 text-[12px] tracking-[0.14em] text-sumi-soft">{label}（yyyy/mm/dd）</p>
      <div className="grid grid-cols-[minmax(5.5rem,1fr)_auto_minmax(4rem,0.7fr)_auto_minmax(4rem,0.7fr)] items-center gap-1">
        <CompactSelect value={year} onChange={(e) => patch({ year: e.target.value })} required>
          <option value="">----</option>
          {yearOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </CompactSelect>
        <span className="text-sm text-sumi-soft">/</span>
        <CompactSelect value={month} onChange={(e) => patch({ month: e.target.value })} required>
          <option value="">--</option>
          {monthOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </CompactSelect>
        <span className="text-sm text-sumi-soft">/</span>
        <CompactSelect value={day} onChange={(e) => patch({ day: e.target.value })} required>
          <option value="">--</option>
          {days.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </CompactSelect>
      </div>
    </div>
  );
}

function ClockSelect({
  label,
  hour,
  minute,
  onHour,
  onMinute,
}: {
  label: string;
  hour: string;
  minute: string;
  onHour: (value: string) => void;
  onMinute: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <CompactSelect value={hour} onChange={(e) => onHour(e.target.value)} required>
          {hourOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </CompactSelect>
        <span className="text-sm text-sumi-soft">:</span>
        <CompactSelect value={minute} onChange={(e) => onMinute(e.target.value)} required>
          {minutesFor(minute).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </CompactSelect>
      </div>
    </Field>
  );
}
