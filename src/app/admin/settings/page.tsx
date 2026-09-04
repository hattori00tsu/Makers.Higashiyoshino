"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SettingsNav } from "@/components/admin/settings-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { Field, PrimaryButton, Select, TextArea, TextInput } from "@/components/account/fields";
import {
  defaultAboutConcept,
  defaultAboutImage,
  defaultHeroImage,
  defaultHomeDisplay,
  defaultHomeHero,
  defaultVillageImage,
  defaultVisitImage,
  hasPendingHomeImage,
  homeEventLimit,
  homeVillageLimit,
  loadHomeDisplay,
  newHomeVillage,
  saveHomeDisplay,
  withVillageIds,
  type AboutConcept,
  type HomeArtistsMode,
  type HomeDisplay,
  type HomeEventsMode,
  type HomeHero,
  type HomeVillage,
} from "@/lib/content/home-display";
import { loadArtistsForAdmin, loadEventsLive } from "@/lib/content/live";
import { blobToDataUrl, compressImage } from "@/lib/image/compress";
import { eventKindLabel, inferEventKind, isPublished, type EventItem } from "@/data/site";

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  [copy[index], copy[next]] = [copy[next], copy[index]];
  return copy;
}

function ImagePicker({
  label,
  hint,
  value,
  fallback,
  aspectClass,
  maxEdge,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  fallback: string;
  aspectClass: string;
  maxEdge: number;
  onChange: (value: string) => void;
}) {
  const preview = value.trim() || fallback;

  async function onFile(file?: File) {
    if (!file) return;
    const local = URL.createObjectURL(file);
    onChange(local);
    try {
      const blob = await compressImage(file, maxEdge);
      onChange(await blobToDataUrl(blob));
    } catch {
      onChange(fallback);
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(local), 1500);
    }
  }

  return (
    <div>
      <p className="mb-3 text-[12px] tracking-[0.14em] text-sumi-soft">{label}</p>
      {hint ? <p className="mb-3 text-xs leading-6 text-sumi-soft">{hint}</p> : null}
      <div className={`relative w-full overflow-hidden border border-line bg-kami ${aspectClass}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
      </div>
      <label className="mt-3 block text-sm">
        <span className="text-[12px] tracking-[0.14em] text-sumi-soft">画像をアップロード</span>
        <input
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {value.trim() && value !== fallback ? (
        <button
          type="button"
          className="mt-2 text-[13px] tracking-[0.14em] text-sumi-soft"
          onClick={() => onChange(fallback)}
        >
          初期の写真に戻す
        </button>
      ) : null}
    </div>
  );
}

function RadioRow<T extends string>({
  name,
  value,
  current,
  label,
  hint,
  onChange,
}: {
  name: string;
  value: T;
  current: T;
  label: string;
  hint?: string;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
      <input
        type="radio"
        className="mt-1.5"
        name={name}
        checked={current === value}
        onChange={() => onChange(value)}
      />
      <span>
        {label}
        {hint ? <span className="block text-xs leading-6">{hint}</span> : null}
      </span>
    </label>
  );
}

export default function AdminSettingsPage() {
  const { ready, user } = useAdmin();
  const localOnly = user?.source === "preview";
  const [home, setHome] = useState<HomeDisplay>(defaultHomeDisplay());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [artists, setArtists] = useState<{ slug: string; name: string }[]>([]);
  const [eventPick, setEventPick] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready) return;
    loadHomeDisplay(localOnly).then((display) => setHome(withVillageIds(display)));
    loadEventsLive(localOnly).then((items) => setEvents(items.filter(isPublished)));
    loadArtistsForAdmin(localOnly).then((items) =>
      setArtists(
        items
          .filter((item) => item.draft.status === "approved" && item.draft.slug)
          .map((item) => ({ slug: item.draft.slug, name: item.draft.name || item.draft.slug })),
      ),
    );
  }, [ready, localOnly]);

  const eventBySlug = useMemo(
    () => new Map(events.map((event) => [event.slug, event])),
    [events],
  );
  const artistBySlug = useMemo(
    () => new Map(artists.map((artist) => [artist.slug, artist])),
    [artists],
  );
  const unusedEvents = events.filter((event) => !home.eventSlugs.includes(event.slug));
  const unusedArtists = artists.filter((artist) => !home.artistSlugs.includes(artist.slug));
  const hero = home.hero ?? defaultHomeHero();
  const villages = home.villages ?? [];
  const about = home.about ?? defaultAboutConcept();

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (hasPendingHomeImage(home)) {
      setMessage("画像の処理が終わるまで待ってください。");
      return;
    }
    try {
      const savedHome = await saveHomeDisplay(home, localOnly);
      setHome(withVillageIds(savedHome));
      setMessage("保存しました。");
    } catch {
      setMessage("保存できませんでした。schema.sql の再実行を確認してください。");
    }
  }

  function patchHero(patch: Partial<HomeHero>) {
    setHome((current) => ({
      ...current,
      hero: { ...(current.hero ?? defaultHomeHero()), ...patch },
    }));
  }

  function patchVillage(id: string | undefined, index: number, patch: Partial<HomeVillage>) {
    setHome((current) => ({
      ...current,
      villages: current.villages.map((item, itemIndex) =>
        (id ? item.id === id : itemIndex === index) ? { ...item, ...patch } : item,
      ),
    }));
  }

  function patchAbout(patch: Partial<AboutConcept>) {
    setHome((current) => ({
      ...current,
      about: { ...(current.about ?? defaultAboutConcept()), ...patch },
    }));
  }

  function setEventsMode(eventsMode: HomeEventsMode) {
    setHome((current) => ({ ...current, eventsMode }));
  }

  function setArtistsMode(artistsMode: HomeArtistsMode) {
    setHome((current) => {
      if (artistsMode !== "manual" || current.artistSlugs.length > 0) {
        return { ...current, artistsMode };
      }
      return { ...current, artistsMode, artistSlugs: artists.map((artist) => artist.slug) };
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">設定</h1>
      <AdminNav />
      <SettingsNav />

      <form className="space-y-12" onSubmit={onSave}>
        <section className="space-y-8">
          <div>
            <h2 className="font-serif text-xl tracking-wide">トップページ</h2>
            <p className="mt-4 text-sm leading-7 text-sumi-soft">
              直近の催しは最大{homeEventLimit}件です。むらの作家は、公開中の全員が出ます。一覧ページの並びは変わりません。
            </p>
          </div>

          <div className="space-y-5">
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">冒頭</h3>
            <p className="text-sm leading-7 text-sumi-soft">
              トップのいちばん上です。改行した行は、公開ページでも改行されます。
            </p>
            <ImagePicker
              label="写真"
              value={hero.image}
              fallback={defaultHeroImage}
              aspectClass="aspect-[16/10] max-w-md"
              maxEdge={1920}
              onChange={(image) => patchHero({ image })}
            />
            <Field label="縦書き">
              <TextInput
                value={hero.sideLabel}
                onChange={(e) => patchHero({ sideLabel: e.target.value })}
              />
            </Field>
            <Field label="縦書き（英語）">
              <TextInput
                value={hero.sideLabelEn}
                onChange={(e) => patchHero({ sideLabelEn: e.target.value })}
              />
            </Field>
            <Field label="英字">
              <TextInput
                value={hero.eyebrow}
                onChange={(e) => patchHero({ eyebrow: e.target.value })}
              />
            </Field>
            <Field label="見出し">
              <TextArea
                rows={3}
                className="min-h-24"
                value={hero.title}
                onChange={(e) => patchHero({ title: e.target.value })}
              />
            </Field>
            <Field label="見出し（英語）">
              <TextArea
                rows={3}
                className="min-h-24"
                value={hero.titleEn}
                onChange={(e) => patchHero({ titleEn: e.target.value })}
              />
            </Field>
            <Field label="リード">
              <TextArea
                rows={4}
                className="min-h-28"
                value={hero.lead}
                onChange={(e) => patchHero({ lead: e.target.value })}
              />
            </Field>
            <Field label="リード（英語）">
              <TextArea
                rows={4}
                className="min-h-28"
                value={hero.leadEn}
                onChange={(e) => patchHero({ leadEn: e.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-5">
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">01 VILLAGE</h3>
            <p className="text-sm leading-7 text-sumi-soft">
              左に写真、右にタイトル・開催日時・紹介を出します。空の項目は公開ページに出ません。複数あるときは、約20秒ごとに次へスライドし、矢印・点・スワイプでも切り替えられます。最大{homeVillageLimit}件です。
            </p>
            {villages.length === 0 ? (
              <p className="text-sm text-sumi-soft">まだありません。追加するとトップに出ます。</p>
            ) : (
              villages.map((village, index) => (
                <div key={village.id ?? index} className="space-y-5 border-t border-line pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-sumi">{index + 1}枚目</p>
                    <span className="flex shrink-0 gap-3 text-[13px] tracking-[0.14em]">
                      <button
                        type="button"
                        className="text-sumi-soft disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() =>
                          setHome((current) => ({
                            ...current,
                            villages: moveItem(current.villages, index, -1),
                          }))
                        }
                      >
                        上へ
                      </button>
                      <button
                        type="button"
                        className="text-sumi-soft disabled:opacity-30"
                        disabled={index === villages.length - 1}
                        onClick={() =>
                          setHome((current) => ({
                            ...current,
                            villages: moveItem(current.villages, index, 1),
                          }))
                        }
                      >
                        下へ
                      </button>
                      <button
                        type="button"
                        className="text-sumi-soft"
                        onClick={() =>
                          setHome((current) => ({
                            ...current,
                            villages: current.villages.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        外す
                      </button>
                    </span>
                  </div>
                  <ImagePicker
                    label="写真"
                    value={village.image}
                    fallback={defaultVillageImage}
                    aspectClass="aspect-[4/5] max-w-xs"
                    maxEdge={1600}
                    onChange={(image) => patchVillage(village.id, index, { image })}
                  />
                  <Field label="タイトル">
                    <TextInput
                      value={village.title}
                      onChange={(e) => patchVillage(village.id, index, { title: e.target.value })}
                    />
                  </Field>
                  <Field label="開催日時">
                    <TextInput
                      value={village.schedule}
                      onChange={(e) => patchVillage(village.id, index, { schedule: e.target.value })}
                      placeholder="例：4月1日〜6月30日"
                    />
                  </Field>
                  <Field label="紹介">
                    <TextArea
                      rows={6}
                      className="min-h-32"
                      value={village.summary}
                      onChange={(e) => patchVillage(village.id, index, { summary: e.target.value })}
                    />
                  </Field>
                  <Field label="タイトル（英語）">
                    <TextInput
                      value={village.titleEn}
                      onChange={(e) => patchVillage(village.id, index, { titleEn: e.target.value })}
                    />
                  </Field>
                  <Field label="開催日時（英語）">
                    <TextInput
                      value={village.scheduleEn}
                      onChange={(e) => patchVillage(village.id, index, { scheduleEn: e.target.value })}
                    />
                  </Field>
                  <Field label="紹介（英語）">
                    <TextArea
                      rows={6}
                      className="min-h-32"
                      value={village.summaryEn}
                      onChange={(e) => patchVillage(village.id, index, { summaryEn: e.target.value })}
                    />
                  </Field>
                </div>
              ))
            )}
            {villages.length < homeVillageLimit ? (
              <button
                type="button"
                className="text-[13px] tracking-[0.14em] text-sumi-soft"
                onClick={() =>
                  setHome((current) => ({
                    ...current,
                    villages: [...current.villages, newHomeVillage()].slice(0, homeVillageLimit),
                  }))
                }
              >
                スライドを足す
              </button>
            ) : null}
          </div>

          <div className="space-y-5">
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">このサイトについて</h3>
            <p className="text-sm leading-7 text-sumi-soft">
              「このサイトについて」のコンセプトです。左に写真、右に見出しと本文を出します。
            </p>
            <ImagePicker
              label="写真"
              value={about.image}
              fallback={defaultAboutImage}
              aspectClass="aspect-[4/5] max-w-xs"
              maxEdge={1600}
              onChange={(image) => patchAbout({ image })}
            />
            <Field label="見出し">
              <TextInput
                value={about.heading}
                onChange={(e) => patchAbout({ heading: e.target.value })}
              />
            </Field>
            <Field label="タイトル">
              <TextInput
                value={about.title}
                onChange={(e) => patchAbout({ title: e.target.value })}
              />
            </Field>
            <Field label="本文">
              <TextArea
                rows={6}
                className="min-h-32"
                value={about.body}
                onChange={(e) => patchAbout({ body: e.target.value })}
              />
            </Field>
            <Field label="見出し（英語）">
              <TextInput
                value={about.headingEn}
                onChange={(e) => patchAbout({ headingEn: e.target.value })}
              />
            </Field>
            <Field label="タイトル（英語）">
              <TextInput
                value={about.titleEn}
                onChange={(e) => patchAbout({ titleEn: e.target.value })}
              />
            </Field>
            <Field label="本文（英語）">
              <TextArea
                rows={6}
                className="min-h-32"
                value={about.bodyEn}
                onChange={(e) => patchAbout({ bodyEn: e.target.value })}
              />
            </Field>
          </div>

          <ImagePicker
            label="村を訪ねるの写真"
            hint="ページ下部の「村を訪ねる」に出ます。"
            value={home.visitImage}
            fallback={defaultVisitImage}
            aspectClass="aspect-[16/10] max-w-md"
            maxEdge={1920}
            onChange={(visitImage) => setHome((current) => ({ ...current, visitImage }))}
          />

          <div className="space-y-4">
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">直近の催し</h3>
            <RadioRow
              name="home-events"
              value="upcoming"
              current={home.eventsMode === "manual" ? "manual" : "upcoming"}
              label="開催中 / 開催予定"
              hint="開催中があれば開催中を、なければ開催予定を出します。上段は会場、下段は個別の催しです。並びは毎回ランダムです。"
              onChange={setEventsMode}
            />
            <RadioRow
              name="home-events"
              value="manual"
              current={home.eventsMode === "manual" ? "manual" : "upcoming"}
              label="指定した順"
              hint={`公開中の催しを、最大${homeEventLimit}件まで並べます。会場は上段、個別の催しは下段に分かれます。`}
              onChange={setEventsMode}
            />
            {home.eventsMode === "manual" ? (
              <div className="space-y-3 pt-2">
                <ul className="divide-y divide-line border-y border-line">
                  {home.eventSlugs.length === 0 ? (
                    <li className="py-3 text-sm text-sumi-soft">まだ選んでいません。</li>
                  ) : (
                    home.eventSlugs.map((slug, index) => {
                      const event = eventBySlug.get(slug);
                      return (
                        <li key={slug} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <span>
                            {event?.title ?? slug}
                            {event ? (
                              <span className="ml-2 text-sumi-soft">
                                / {eventKindLabel(inferEventKind(event, events))}
                              </span>
                            ) : (
                              <span className="ml-2 text-sumi-soft">/ 見つかりません</span>
                            )}
                          </span>
                          <span className="flex shrink-0 gap-3 text-[13px] tracking-[0.14em]">
                            <button
                              type="button"
                              className="text-sumi-soft disabled:opacity-30"
                              disabled={index === 0}
                              onClick={() =>
                                setHome((current) => ({
                                  ...current,
                                  eventSlugs: moveItem(current.eventSlugs, index, -1),
                                }))
                              }
                            >
                              上へ
                            </button>
                            <button
                              type="button"
                              className="text-sumi-soft disabled:opacity-30"
                              disabled={index === home.eventSlugs.length - 1}
                              onClick={() =>
                                setHome((current) => ({
                                  ...current,
                                  eventSlugs: moveItem(current.eventSlugs, index, 1),
                                }))
                              }
                            >
                              下へ
                            </button>
                            <button
                              type="button"
                              className="text-sumi-soft"
                              onClick={() =>
                                setHome((current) => ({
                                  ...current,
                                  eventSlugs: current.eventSlugs.filter((item) => item !== slug),
                                }))
                              }
                            >
                              外す
                            </button>
                          </span>
                        </li>
                      );
                    })
                  )}
                </ul>
                {home.eventSlugs.length < homeEventLimit && unusedEvents.length > 0 ? (
                  <div className="flex gap-3">
                    <Select value={eventPick} onChange={(e) => setEventPick(e.target.value)}>
                      <option value="">催しを足す</option>
                      {unusedEvents.map((event) => (
                        <option key={event.slug} value={event.slug}>
                          {event.title}
                        </option>
                      ))}
                    </Select>
                    <PrimaryButton
                      type="button"
                      disabled={!eventPick}
                      onClick={() => {
                        if (!eventPick) return;
                        setHome((current) => ({
                          ...current,
                          eventSlugs: [...current.eventSlugs, eventPick].slice(0, homeEventLimit),
                        }));
                        setEventPick("");
                      }}
                    >
                      追加
                    </PrimaryButton>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">つくり手</h3>
            <RadioRow
              name="home-artists"
              value="default"
              current={home.artistsMode}
              label="いまの順"
              hint="登録されている順のまま出します。"
              onChange={setArtistsMode}
            />
            <RadioRow
              name="home-artists"
              value="manual"
              current={home.artistsMode}
              label="指定した順"
              hint="上から並べます。リストに無い人は後ろに足します。"
              onChange={setArtistsMode}
            />
            <RadioRow
              name="home-artists"
              value="random"
              current={home.artistsMode}
              label="ランダム"
              hint="見るたびに並びが変わります。"
              onChange={setArtistsMode}
            />
            {home.artistsMode === "manual" ? (
              <div className="space-y-3 pt-2">
                <ul className="divide-y divide-line border-y border-line">
                  {home.artistSlugs.length === 0 ? (
                    <li className="py-3 text-sm text-sumi-soft">まだ並べていません。</li>
                  ) : (
                    home.artistSlugs.map((slug, index) => {
                      const artist = artistBySlug.get(slug);
                      return (
                        <li key={slug} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <span>{artist?.name ?? slug}</span>
                          <span className="flex shrink-0 gap-3 text-[13px] tracking-[0.14em]">
                            <button
                              type="button"
                              className="text-sumi-soft disabled:opacity-30"
                              disabled={index === 0}
                              onClick={() =>
                                setHome((current) => ({
                                  ...current,
                                  artistSlugs: moveItem(current.artistSlugs, index, -1),
                                }))
                              }
                            >
                              上へ
                            </button>
                            <button
                              type="button"
                              className="text-sumi-soft disabled:opacity-30"
                              disabled={index === home.artistSlugs.length - 1}
                              onClick={() =>
                                setHome((current) => ({
                                  ...current,
                                  artistSlugs: moveItem(current.artistSlugs, index, 1),
                                }))
                              }
                            >
                              下へ
                            </button>
                            <button
                              type="button"
                              className="text-sumi-soft"
                              onClick={() =>
                                setHome((current) => ({
                                  ...current,
                                  artistSlugs: current.artistSlugs.filter((item) => item !== slug),
                                }))
                              }
                            >
                              外す
                            </button>
                          </span>
                        </li>
                      );
                    })
                  )}
                </ul>
                {unusedArtists.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {unusedArtists.map((artist) => (
                      <button
                        key={artist.slug}
                        type="button"
                        className="border border-line px-3 py-1.5 text-[12px] tracking-[0.12em] text-sumi-soft"
                        onClick={() =>
                          setHome((current) => ({
                            ...current,
                            artistSlugs: [...current.artistSlugs, artist.slug],
                          }))
                        }
                      >
                        {artist.name}を足す
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <PrimaryButton type="submit">保存する</PrimaryButton>
        {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      </form>
    </div>
  );
}
