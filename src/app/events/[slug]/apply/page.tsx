import type { Metadata } from "next";
import { ApplyForm } from "@/components/events/apply-form";
import { eventViewModel, loadPublicEvent, loadPublicEvents } from "@/lib/content/public-events";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await loadPublicEvents();
  return items.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadPublicEvent(slug);
  return { title: event ? `${event.title}の申込み` : "申込み" };
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const all = await loadPublicEvents();
  const event = all.find((item) => item.slug === slug) ?? null;
  const { lineage } = eventViewModel(event, all);
  return <ApplyForm slug={slug} initial={event} initialLineage={lineage} />;
}
