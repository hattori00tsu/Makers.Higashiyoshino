import Link from "next/link";
import { type NewsItem } from "@/lib/content/catalog";
import { formatDateJa } from "@/lib/dates";

export function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="mt-10 text-sm text-sumi-soft">まだお知らせはありません。</p>;
  }

  return (
    <ul className="mt-10 divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.slug} className="py-5">
          <Link href={`/news/${item.slug}`} className="block">
            <p className="text-[11px] tracking-[0.16em] text-tsuchi">{formatDateJa(item.publishedAt)}</p>
            <h2 className="mt-2 font-serif text-xl tracking-wide">{item.title}</h2>
          </Link>
        </li>
      ))}
    </ul>
  );
}
