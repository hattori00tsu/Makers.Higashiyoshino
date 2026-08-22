import type { Metadata } from "next";
import { EventDetailClient } from "@/components/events/event-detail-client";
import { eventViewModel, loadPublicEvent, loadPublicEvents } from "@/lib/content/public-events";
import { getVillageForecast } from "@/lib/weather";

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
  return { title: event?.title ?? "催し" };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const [all, forecast] = await Promise.all([loadPublicEvents(), getVillageForecast()]);
  const event = all.find((item) => item.slug === slug) ?? null;
  const { programs, venues, parent, lineage, nestedByParent, seriesPeers } = eventViewModel(event, all);
  return (
    <EventDetailClient
      slug={slug}
      initial={event}
      initialPrograms={programs}
      initialVenues={venues}
      initialParent={parent}
      initialLineage={lineage}
      initialNestedByParent={nestedByParent}
      initialSeriesPeers={seriesPeers}
      forecast={forecast}
    />
  );
}
