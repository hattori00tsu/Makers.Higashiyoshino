import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventArticle } from "@/components/events/event-article";
import { eventPhase } from "@/lib/calendar";
import { loadPublicArtistNames } from "@/lib/content/public-artists";
import { eventViewModel, loadPublicEvent, loadPublicEvents } from "@/lib/content/public-events";
import { tokyoDateKey } from "@/lib/dates";
import { localizedEvent } from "@/lib/i18n/content";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { getVillageForecast } from "@/lib/weather";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;
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
  return { title: event ? localizedEvent(event, locale).title : t.events.title };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const [event, all, artistNames] = await Promise.all([
    loadPublicEvent(slug),
    loadPublicEvents(),
    loadPublicArtistNames(),
  ]);
  if (!event) notFound();

  const archived = eventPhase(event) === "archive";
  const { programs, venues, lineage, nestedByParent, seriesPeers } = eventViewModel(event, all);
  const start = event.sessions[0]?.startsAt;
  const forecast = !archived && event.isOutdoor && start ? await getVillageForecast() : {};
  const weather = start ? forecast[tokyoDateKey(start)] : undefined;

  return (
    <EventArticle
      event={event}
      weather={weather}
      venues={venues}
      programs={programs}
      nestedByParent={nestedByParent}
      lineage={lineage}
      seriesPeers={seriesPeers}
      artistNames={artistNames}
    />
  );
}
