"use client";

import { EventExplorer } from "@/components/events/event-explorer";
import type { EventItem } from "@/data/site";
import type { DailyWeather } from "@/lib/weather";

type Props = {
  initialOngoing: EventItem[];
  initialUpcoming: EventItem[];
  initialPrograms?: EventItem[];
  weather: Record<string, DailyWeather>;
};

export function EventsBrowser({
  initialOngoing,
  initialUpcoming,
  initialPrograms = [],
  weather,
}: Props) {
  return (
    <EventExplorer
      ongoing={initialOngoing}
      upcoming={initialUpcoming}
      programs={initialPrograms}
      weather={weather}
    />
  );
}
