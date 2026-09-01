import type { Metadata } from "next";
import { ApplyForm } from "@/components/events/apply-form";
import { eventViewModel, loadPublicEvent, loadPublicEvents } from "@/lib/content/public-events";
import { localizedEvent } from "@/lib/i18n/content";
import { getLocale, getMessages } from "@/lib/i18n/server";

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
  const locale = await getLocale();
  const t = await getMessages();
  const event = await loadPublicEvent(slug);
  return { title: event ? t.apply.meta(localizedEvent(event, locale).title) : t.apply.metaFallback };
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const [event, all] = await Promise.all([loadPublicEvent(slug), loadPublicEvents()]);
  const { lineage } = eventViewModel(event, all);
  return <ApplyForm slug={slug} initial={event} initialLineage={lineage} />;
}
