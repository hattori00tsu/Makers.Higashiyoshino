"use client";

import { useEffect, useState } from "react";
import { findNewsLive } from "@/lib/content/live";
import { type NewsItem } from "@/lib/content/catalog";
import { formatDateJa } from "@/lib/dates";

export function NewsArticle({ slug, initial }: { slug: string; initial: NewsItem | null }) {
  const [item, setItem] = useState(initial);

  useEffect(() => {
    findNewsLive(slug).then((item) => setItem(item ?? initial));
  }, [slug, initial]);

  if (!item || item.status !== "published") {
    return <p className="text-sm text-sumi-soft">お知らせが見つかりません。</p>;
  }

  return (
    <article>
      <p className="text-[11px] tracking-[0.18em] text-tsuchi">{formatDateJa(item.publishedAt)}</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{item.title}</h1>
      <p className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-sumi-soft">{item.body}</p>
    </article>
  );
}
