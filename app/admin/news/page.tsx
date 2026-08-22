"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import {
  Field,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/account/fields";
import { loadNewsLive, saveNewsLive, type NewsItem } from "@/lib/content/live";
import { formatDateJa } from "@/lib/dates";

const emptyNews = (): NewsItem => ({
  slug: "",
  title: "",
  body: "",
  publishedAt: new Date().toISOString(),
  status: "draft",
});

export default function AdminNewsPage() {
  const { ready, user } = useAdmin();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [draft, setDraft] = useState<NewsItem>(emptyNews());
  const [editing, setEditing] = useState<string | null>(null);
  const localOnly = user?.source === "preview";

  useEffect(() => {
    if (ready) loadNewsLive(localOnly).then(setItems);
  }, [ready, localOnly]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  async function persist(next: NewsItem[]) {
    await saveNewsLive(next, localOnly);
    setItems(next);
  }

  async function onSave() {
    const slug = draft.slug.trim() || `news-${Date.now().toString(36)}`;
    const nextItem = { ...draft, slug };
    const next = items.filter((item) => item.slug !== slug && item.slug !== editing);
    await persist([...next, nextItem]);
    setDraft(emptyNews());
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">お知らせ</h1>
      <AdminNav />

      <div className="space-y-5">
        <Field label="タイトル">
          <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="公開URL">
          <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        </Field>
        <Field label="本文">
          <TextArea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        </Field>
        <Field label="状態">
          <Select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as NewsItem["status"] })}
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </Select>
        </Field>
        <PrimaryButton type="button" onClick={onSave}>
          {editing ? "更新する" : "保存する"}
        </PrimaryButton>
      </div>

      <ul className="mt-12 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.slug} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-[11px] tracking-[0.14em] text-tsuchi">
                {item.status === "published" ? "公開" : "下書き"}
                <span className="mx-2 text-line">/</span>
                {formatDateJa(item.publishedAt)}
              </p>
              <p className="mt-1 font-serif text-lg">{item.title}</p>
            </div>
            <div className="flex gap-3 text-[13px] tracking-[0.14em]">
              <button type="button" className="text-sugi" onClick={() => { setDraft(item); setEditing(item.slug); }}>
                編集
              </button>
              <Link href={`/news/${item.slug}`} className="text-sumi-soft">
                見る
              </Link>
              <button
                type="button"
                className="text-sumi-soft"
                onClick={() => persist(items.filter((row) => row.slug !== item.slug))}
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
