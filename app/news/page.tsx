import type { Metadata } from "next";
import { NewsList } from "@/components/news/news-list";
import { seedNews } from "@/lib/content/catalog";

export const metadata: Metadata = {
  title: "お知らせ",
};

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">NEWS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">お知らせ</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">運営からの短い知らせです。</p>
      <NewsList initial={seedNews.filter((item) => item.status === "published")} />
    </div>
  );
}
