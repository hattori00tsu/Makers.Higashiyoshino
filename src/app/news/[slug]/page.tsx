import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArticle } from "@/components/news/news-article";
import { loadPublicNews, loadPublicNewsItem } from "@/lib/content/public-news";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await loadPublicNews();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadPublicNewsItem(slug);
  return { title: item?.title ?? "お知らせ" };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await loadPublicNewsItem(slug);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <NewsArticle item={item} />
    </div>
  );
}
