"use client";

import { useEffect, useState } from "react";
import { EventExplorer } from "@/components/events/event-explorer";
import { shuffleItems } from "@/lib/content/home-display";
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
  const [ongoing, setOngoing] = useState(initialOngoing);
  const [upcoming, setUpcoming] = useState(initialUpcoming);

  useEffect(() => {
    setOngoing(shuffleItems(initialOngoing));
    setUpcoming(shuffleItems(initialUpcoming));
  }, [initialOngoing, initialUpcoming]);

  return (
    <EventExplorer
      ongoing={ongoing}
      upcoming={upcoming}
      programs={initialPrograms}
      weather={weather}
    />
  );
}
