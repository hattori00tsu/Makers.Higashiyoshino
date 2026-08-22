import type { Metadata } from "next";
import { connection } from "next/server";
import { EventsBrowser } from "@/components/events/events-browser";
import { publicEventLists } from "@/lib/calendar";
import { shuffleItems } from "@/lib/content/home-display";
import { loadPublicEvents } from "@/lib/content/public-events";
import { getVillageForecast } from "@/lib/weather";

export const metadata: Metadata = {
  title: "催し",
};

export default async function EventsPage() {
  await connection();
  const [all, weather] = await Promise.all([loadPublicEvents(), getVillageForecast()]);
  const lists = publicEventLists(all);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">EVENTS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">催し</h1>

      <div className="mt-10 md:mt-12">
        <EventsBrowser
          initialOngoing={shuffleItems(lists.ongoing)}
          initialUpcoming={shuffleItems(lists.upcoming)}
          initialPrograms={all}
          weather={weather}
        />
      </div>
    </div>
  );
}
