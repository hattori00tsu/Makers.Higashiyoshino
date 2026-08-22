import type { Metadata } from "next";
import { NewsArticle } from "@/components/news/news-article";
import { seedNews } from "@/lib/content/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return seedNews.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = seedNews.find((news) => news.slug === slug);
  return { title: item?.title ?? "お知らせ" };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const initial = seedNews.find((item) => item.slug === slug) ?? null;
  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <NewsArticle slug={slug} initial={initial} />
    </div>
  );
}
