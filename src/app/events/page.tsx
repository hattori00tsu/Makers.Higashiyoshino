import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events/events-browser";
import { publicEventLists } from "@/lib/calendar";
import { loadPublicEvents } from "@/lib/content/public-events";
import { getVillageForecast } from "@/lib/weather";
import { getMessages } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.events.title };
}

export default async function EventsPage() {
  const t = await getMessages();
  const [all, weather] = await Promise.all([loadPublicEvents(), getVillageForecast()]);
  const lists = publicEventLists(all);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">EVENTS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{t.events.title}</h1>

      <div className="mt-10 md:mt-12">
        <EventsBrowser
          initialOngoing={lists.ongoing}
          initialUpcoming={lists.upcoming}
          initialPrograms={all}
          weather={weather}
        />
      </div>
    </div>
  );
}
