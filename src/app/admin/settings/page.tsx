"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { Field, PrimaryButton, Select, TextArea, TextInput } from "@/components/account/fields";
import {
  defaultMailSettings,
  loadMailSettings,
  saveMailSettings,
  type MailSettings,
} from "@/lib/mail/settings";
import {
  defaultMailTemplates,
  MAIL_TEMPLATE_GROUPS,
  MAIL_TEMPLATE_META,
  type MailCopy,
  type MailTemplateKey,
} from "@/lib/mail/templates";
import {
  defaultHomeDisplay,
  homeEventLimit,
  loadHomeDisplay,
  saveHomeDisplay,
  type HomeArtistsMode,
  type HomeDisplay,
  type HomeEventsMode,
} from "@/lib/content/home-display";
import { loadArtistsForAdmin, loadEventsLive } from "@/lib/content/live";
import { eventKindLabel, inferEventKind, isPublished, type EventItem } from "@/data/site";

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  [copy[index], copy[next]] = [copy[next], copy[index]];
  return copy;
}

function MailCopyEditor({
  copy,
  onChange,
  onReset,
}: {
  copy: MailSettings["copy"];
  onChange: (key: MailTemplateKey, patch: Partial<MailCopy>) => void;
  onReset: (key: MailTemplateKey) => void;
}) {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-serif text-xl tracking-wide">メールの文面</h2>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          空になった差し込みは、その行が消えます。保存すると、次の送信から使います。
        </p>
      </div>
      {MAIL_TEMPLATE_GROUPS.map((group) => (
        <div key={group.title} className="space-y-8">
          <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">{group.title}</h3>
          {group.keys.map((key) => {
            const meta = MAIL_TEMPLATE_META[key];
            const item = copy[key];
            return (
              <div key={key} className="space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-sumi">{meta.label}</p>
                  <button
                    type="button"
                    className="text-[13px] tracking-[0.14em] text-sumi-soft"
                    onClick={() => onReset(key)}
                  >
                    初期文面に戻す
                  </button>
                </div>
                <Field label="件名">
                  <TextInput
                    value={item.subject}
                    onChange={(e) => onChange(key, { subject: e.target.value })}
                  />
                </Field>
                <Field label="本文">
                  <TextArea
                    rows={9}
                    className="min-h-40"
                    value={item.text}
                    onChange={(e) => onChange(key, { text: e.target.value })}
                  />
                </Field>
                <p className="text-xs leading-6 text-sumi-soft">{meta.placeholders}</p>
              </div>
            );
          })}
        </div>
      ))}
    </section>
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
  const [draft, setDraft] = useState<MailSettings>(defaultMailSettings());
  const [home, setHome] = useState<HomeDisplay>(defaultHomeDisplay());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [artists, setArtists] = useState<{ slug: string; name: string }[]>([]);
  const [eventPick, setEventPick] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready) return;
    loadMailSettings(localOnly).then(setDraft);
    loadHomeDisplay(localOnly).then(setHome);
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

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await Promise.all([saveMailSettings(draft, localOnly), saveHomeDisplay(home, localOnly)]);
      setMessage("保存しました。");
    } catch {
      setMessage("保存できませんでした。schema.sql の再実行を確認してください。");
    }
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

      <form className="space-y-12" onSubmit={onSave}>
        <section className="space-y-8">
          <div>
            <h2 className="font-serif text-xl tracking-wide">トップページ</h2>
            <p className="mt-4 text-sm leading-7 text-sumi-soft">
              直近の催しは最大{homeEventLimit}件です。むらの作家は、公開中の全員が出ます。一覧ページの並びは変わりません。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">直近の催し</h3>
            <RadioRow
              name="home-events"
              value="upcoming"
              current={home.eventsMode === "manual" ? "manual" : "upcoming"}
              label="開催中 / 開催予定"
              hint="開催中があれば開催中を、なければ開催予定を出します。並びは毎回ランダムです。"
              onChange={setEventsMode}
            />
            <RadioRow
              name="home-events"
              value="manual"
              current={home.eventsMode === "manual" ? "manual" : "upcoming"}
              label="指定した順"
              hint={`公開中の催しを、最大${homeEventLimit}件まで並べます。`}
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
            <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">むらの作家</h3>
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

        <section>
          <h2 className="font-serif text-xl tracking-wide">メール承認</h2>
          <p className="mt-4 text-sm leading-7 text-sumi-soft">
            メールにログイン用のリンクを送ります。パスワードはありません。Authentication の Email で Magic link をオンにし、Redirect URL に
            localhost、本番、Vercel のプレビュー（例: <code className="text-sumi">https://*-hattori-tsugutos-projects.vercel.app/**</code>
            ）の <code className="text-sumi">/auth/callback</code> を入れてください。SMTP に Resend
            を付けていないと、チーム以外のメールには届きません。
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="font-serif text-xl tracking-wide">運営からのメール</h2>
          <p className="text-sm leading-7 text-sumi-soft">
            申込みの受付は Resend で送ります。<code className="text-sumi">RESEND_API_KEY</code> と{" "}
            <code className="text-sumi">RESEND_FROM</code> が無いときは保存だけします。文面は下で直せます。差し込みは{" "}
            <code className="text-sumi">{"{{eventTitle}}"}</code> のように書きます。ログイン用のメールは
            Authentication の Email Templates です。
          </p>
          <Field label="運営の通知先">
            <TextInput
              type="email"
              value={draft.notifyEmail}
              onChange={(e) => setDraft({ ...draft, notifyEmail: e.target.value })}
              placeholder="ops@example.com"
            />
          </Field>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailAdminPending}
              onChange={(e) => setDraft({ ...draft, mailAdminPending: e.target.checked })}
            />
            <span>作家の登録、または作家が催しを作ったとき、運営へ通知する</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailApplications}
              onChange={(e) => setDraft({ ...draft, mailApplications: e.target.checked })}
            />
            <span>催しの予約が確定したとき、来訪者へ確認メールを送る</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailArtistApplications}
              onChange={(e) => setDraft({ ...draft, mailArtistApplications: e.target.checked })}
            />
            <span>催しの申込みがあったとき、参加作家へ通知メールを送る</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailArtistDecision}
              onChange={(e) => setDraft({ ...draft, mailArtistDecision: e.target.checked })}
            />
            <span>作家を公開または非公開にしたとき、本人へメールを送る</span>
          </label>
        </section>

        <MailCopyEditor
          copy={draft.copy}
          onChange={(key, patch) =>
            setDraft((current) => ({
              ...current,
              copy: { ...current.copy, [key]: { ...current.copy[key], ...patch } },
            }))
          }
          onReset={(key) =>
            setDraft((current) => ({
              ...current,
              copy: { ...current.copy, [key]: defaultMailTemplates()[key] },
            }))
          }
        />

        <PrimaryButton type="submit">保存する</PrimaryButton>
        {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      </form>
    </div>
  );
}
