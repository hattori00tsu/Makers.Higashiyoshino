"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { Field, PrimaryButton, TextInput } from "@/components/account/fields";
import { loadEventOptions, saveEventOptions } from "@/lib/content/live";
import {
  defaultEventOptions,
  emptyNamedOption,
  type EventOptions,
  type NamedOption,
} from "@/lib/content/options";
import { emptyPlace, newPlaceId, type PlaceOption } from "@/data/site";

export default function AdminOptionsPage() {
  const { ready, user } = useAdmin();
  const localOnly = user?.source === "preview";
  const [options, setOptions] = useState<EventOptions>(defaultEventOptions());
  const [message, setMessage] = useState("");
  const [categoryDraft, setCategoryDraft] = useState<NamedOption>(emptyNamedOption());
  const [genreDraft, setGenreDraft] = useState<NamedOption>(emptyNamedOption());
  const [seriesDraft, setSeriesDraft] = useState<NamedOption>(emptyNamedOption());
  const [venueDraft, setVenueDraft] = useState<PlaceOption>(emptyPlace());
  const [parkingDraft, setParkingDraft] = useState<PlaceOption>(emptyPlace());

  useEffect(() => {
    if (ready) loadEventOptions(localOnly).then(setOptions);
  }, [ready, localOnly]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  async function persist(next: EventOptions) {
    setMessage("");
    try {
      await saveEventOptions(next, localOnly);
      setOptions(next);
      setMessage("保存しました。");
    } catch {
      setMessage("保存できませんでした。schema.sql の再実行を確認してください。");
    }
  }

  function upsertNamed(items: NamedOption[], next: NamedOption, originalName: string) {
    const name = next.name.trim();
    const nameEn = next.nameEn.trim();
    if (!name) return items;
    const key = originalName || name;
    const index = items.findIndex((row) => row.name === key);
    if (items.some((row) => row.name === name && row.name !== key)) return items;
    if (index < 0) return [...items, { name, nameEn }];
    const copy = items.slice();
    copy[index] = { name, nameEn };
    return copy;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">項目</h1>
      <AdminNav />
      <p className="mb-10 text-sm leading-7 text-sumi-soft">
        催しの種別と作家のカテゴリー、シリーズ、会場・駐車場をここで増やします。種別は催しの編集で、カテゴリーは作家登録で複数選べます。シリーズは毎年続く開催につけ、年号は入れません。会場・駐車場は総合開催と会場で選び、個別の催しは所属する会場の案内を使います。英語版の名前も入れられます。空なら日本語のまま出ます。
      </p>
      {message ? <p className="mb-8 text-sm text-sumi-soft">{message}</p> : null}

      <NameListSection
        title="催しの種別"
        placeholder="例：市"
        placeholderEn="e.g. Market"
        items={options.categories}
        draft={categoryDraft}
        setDraft={setCategoryDraft}
        onSave={(item, originalName) =>
          persist({ ...options, categories: upsertNamed(options.categories, item, originalName) })
        }
        onDelete={(name) =>
          persist({ ...options, categories: options.categories.filter((row) => row.name !== name) })
        }
      />

      <NameListSection
        title="つくり手のカテゴリー"
        placeholder="例：金工"
        placeholderEn="e.g. Metalwork"
        items={options.genres}
        draft={genreDraft}
        setDraft={setGenreDraft}
        onSave={(item, originalName) => persist({ ...options, genres: upsertNamed(options.genres, item, originalName) })}
        onDelete={(name) => persist({ ...options, genres: options.genres.filter((row) => row.name !== name) })}
        className="mt-14"
      />

      <NameListSection
        title="シリーズ"
        placeholder="例：オープンアトリエ"
        placeholderEn="e.g. Open Atelier"
        items={options.series}
        draft={seriesDraft}
        setDraft={setSeriesDraft}
        onSave={(item, originalName) => persist({ ...options, series: upsertNamed(options.series, item, originalName) })}
        onDelete={(name) => persist({ ...options, series: options.series.filter((row) => row.name !== name) })}
        className="mt-14"
        hint="年号は付けず、毎年同じ名前を使います。催しの編集で選びます。"
      />

      <PlaceSection
        title="会場"
        items={options.venues}
        draft={venueDraft}
        setDraft={setVenueDraft}
        onSave={(item) => {
          const without = options.venues.filter((row) => row.id !== item.id);
          persist({ ...options, venues: [...without, item] });
          setVenueDraft(emptyPlace());
        }}
        onDelete={(id) => persist({ ...options, venues: options.venues.filter((row) => row.id !== id) })}
        urlHint="Google マップのリンク"
      />

      <PlaceSection
        title="駐車場"
        items={options.parkings}
        draft={parkingDraft}
        setDraft={setParkingDraft}
        onSave={(item) => {
          const without = options.parkings.filter((row) => row.id !== item.id);
          persist({ ...options, parkings: [...without, item] });
          setParkingDraft(emptyPlace());
        }}
        onDelete={(id) => persist({ ...options, parkings: options.parkings.filter((row) => row.id !== id) })}
        urlHint="地図などのリンク"
      />
    </div>
  );
}

function NameListSection({
  title,
  placeholder,
  placeholderEn,
  items,
  draft,
  setDraft,
  onSave,
  onDelete,
  className = "",
  hint,
}: {
  title: string;
  placeholder: string;
  placeholderEn: string;
  items: NamedOption[];
  draft: NamedOption;
  setDraft: (next: NamedOption) => void;
  onSave: (item: NamedOption, originalName: string) => void;
  onDelete: (name: string) => void;
  className?: string;
  hint?: string;
}) {
  const [editingName, setEditingName] = useState("");
  const editing = Boolean(editingName);
  return (
    <section className={`space-y-5 ${className}`}>
      <h2 className="font-serif text-xl tracking-wide">{title}</h2>
      {hint ? <p className="text-sm leading-7 text-sumi-soft">{hint}</p> : null}
      <Field label="日本語">
        <TextInput
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder={placeholder}
        />
      </Field>
      <Field label="英語">
        <TextInput
          value={draft.nameEn}
          onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
          placeholder={placeholderEn}
        />
      </Field>
      <PrimaryButton
        type="button"
        onClick={() => {
          const name = draft.name.trim();
          if (!name) return;
          if (!editing && items.some((item) => item.name === name)) return;
          onSave({ name, nameEn: draft.nameEn.trim() }, editingName);
          setDraft(emptyNamedOption());
          setEditingName("");
        }}
      >
        {editing ? "更新する" : "追加"}
      </PrimaryButton>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4 py-3 text-sm">
            <div>
              <p>{item.name}</p>
              {item.nameEn ? <p className="mt-1 text-[12px] text-sumi-soft">{item.nameEn}</p> : null}
            </div>
            <div className="flex shrink-0 gap-3 text-[13px] tracking-[0.14em]">
              <button
                type="button"
                className="text-sugi"
                onClick={() => {
                  setDraft(item);
                  setEditingName(item.name);
                }}
              >
                編集
              </button>
              <button type="button" className="text-sumi-soft" onClick={() => onDelete(item.name)}>
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlaceSection({
  title,
  items,
  draft,
  setDraft,
  onSave,
  onDelete,
  urlHint,
}: {
  title: string;
  items: PlaceOption[];
  draft: PlaceOption;
  setDraft: (next: PlaceOption) => void;
  onSave: (item: PlaceOption) => void;
  onDelete: (id: string) => void;
  urlHint: string;
}) {
  return (
    <section className="mt-14 space-y-5">
      <h2 className="font-serif text-xl tracking-wide">{title}</h2>
      <Field label="タイトル">
        <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </Field>
      <Field label="タイトル（英語）">
        <TextInput
          value={draft.titleEn ?? ""}
          onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })}
        />
      </Field>
      <Field label="リンク">
        <TextInput
          value={draft.url}
          onChange={(e) => setDraft({ ...draft, url: e.target.value })}
          placeholder={urlHint}
        />
      </Field>
      <PrimaryButton
        type="button"
        onClick={() => {
          if (!draft.title.trim()) return;
          onSave({
            ...draft,
            id: draft.id || newPlaceId(),
            title: draft.title.trim(),
            titleEn: (draft.titleEn ?? "").trim(),
            url: draft.url.trim(),
          });
        }}
      >
        {draft.id && items.some((item) => item.id === draft.id) ? "更新する" : "追加"}
      </PrimaryButton>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm">{item.title}</p>
              {item.titleEn ? <p className="mt-1 text-[12px] text-sumi-soft">{item.titleEn}</p> : null}
              {item.url ? (
                <p className="mt-1 break-all text-[12px] text-sumi-soft">{item.url}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-3 text-[13px] tracking-[0.14em]">
              <button type="button" className="text-sugi" onClick={() => setDraft(item)}>
                編集
              </button>
              <button type="button" className="text-sumi-soft" onClick={() => onDelete(item.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
