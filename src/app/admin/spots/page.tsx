"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { Field, PrimaryButton, TextInput, TextArea, Select } from "@/components/account/fields";
import { loadSpotCategories, loadSpotsLive, saveSpotCategories, saveSpotsLive } from "@/lib/content/live";
import { emptySpot, type SpotItem } from "@/data/site";

export default function AdminSpotsPage() {
  const { ready, user } = useAdmin();
  const [items, setItems] = useState<SpotItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [draft, setDraft] = useState<SpotItem>(emptySpot());
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const localOnly = user?.source === "preview";
  const categoryChoices = draft.category && !categories.includes(draft.category)
    ? [...categories, draft.category]
    : categories;

  useEffect(() => {
    if (!ready) return;
    Promise.all([loadSpotsLive(localOnly), loadSpotCategories(localOnly)]).then(([spots, nextCategories]) => {
      setItems(spots);
      setCategories(nextCategories);
      setDraft((current) => {
        if (nextCategories.includes(current.category)) return current;
        return { ...current, category: nextCategories[0] ?? "" };
      });
    });
  }, [ready, localOnly]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  async function persist(next: SpotItem[]) {
    setMessage("");
    try {
      await saveSpotsLive(next, localOnly);
      setItems(next);
      return true;
    } catch {
      setMessage("保存できませんでした。schema.sql の再実行を確認してください。");
      return false;
    }
  }

  async function persistCategories(next: string[]) {
    setMessage("");
    try {
      await saveSpotCategories(next, localOnly);
      setCategories(next);
      return true;
    } catch {
      setMessage("保存できませんでした。schema.sql の再実行を確認してください。");
      return false;
    }
  }

  async function onAddCategory() {
    const name = categoryDraft.trim();
    if (!name || categories.includes(name)) return;
    const next = [...categories, name];
    const ok = await persistCategories(next);
    if (!ok) return;
    setCategoryDraft("");
    if (!draft.category) setDraft({ ...draft, category: name });
  }

  async function onDeleteCategory(name: string) {
    const next = categories.filter((item) => item !== name);
    const ok = await persistCategories(next);
    if (!ok) return;
    if (draft.category === name) setDraft({ ...draft, category: next[0] ?? "" });
  }

  async function onSave() {
    if (!draft.name.trim()) return;
    if (!draft.category.trim()) {
      setMessage("種別をひとつ選んでください。");
      return;
    }
    const without = items.filter((item) => item.name !== draft.name && item.name !== editing);
    const ok = await persist([
      ...without,
      {
        ...draft,
        name: draft.name.trim(),
        place: draft.place.trim(),
        mapsUrl: draft.mapsUrl.trim(),
      },
    ]);
    if (!ok) return;
    setDraft({ ...emptySpot(), category: draft.category || categories[0] || "" });
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">周辺</h1>
      <AdminNav />
      {message ? <p className="mb-8 text-sm text-sumi-soft">{message}</p> : null}

      <section className="space-y-5">
        <h2 className="font-serif text-xl tracking-wide">種別</h2>
        <p className="text-sm leading-7 text-sumi-soft">周辺案内の分類です。追加した種別を、下の登録で選びます。</p>
        <div className="flex gap-3">
          <TextInput
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            placeholder="例：買物"
          />
          <PrimaryButton type="button" onClick={onAddCategory}>
            追加
          </PrimaryButton>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {categories.map((item) => (
            <li key={item} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>{item}</span>
              <button type="button" className="text-sumi-soft" onClick={() => onDeleteCategory(item)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 space-y-5">
        <h2 className="font-serif text-xl tracking-wide">登録</h2>
        <Field label="種別">
          {categoryChoices.length ? (
            <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {categoryChoices.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-sumi-soft">先に種別を追加してください。</p>
          )}
        </Field>
        <Field label="名前">
          <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="説明">
          <TextArea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
        </Field>
        <Field label="地名">
          <TextInput
            value={draft.place}
            onChange={(e) => setDraft({ ...draft, place: e.target.value })}
            placeholder="東吉野村役場 など"
          />
        </Field>
        <Field label="Google マップ">
          <TextInput
            value={draft.mapsUrl}
            onChange={(e) => setDraft({ ...draft, mapsUrl: e.target.value })}
            placeholder="Google マップのリンク"
          />
        </Field>
        <PrimaryButton type="button" onClick={onSave}>
          {editing ? "更新する" : "保存する"}
        </PrimaryButton>
      </div>

      <ul className="mt-12 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-[11px] tracking-[0.14em] text-tsuchi">{item.category}</p>
              <p className="mt-1 font-serif text-lg">{item.name}</p>
              {item.place ? <p className="mt-1 text-sm text-sumi-soft">{item.place}</p> : null}
            </div>
            <div className="flex gap-3 text-[13px] tracking-[0.14em]">
              <button type="button" className="text-sugi" onClick={() => { setDraft(item); setEditing(item.name); }}>
                編集
              </button>
              <button
                type="button"
                className="text-sumi-soft"
                onClick={() => persist(items.filter((row) => row.name !== item.name))}
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
