"use client";

import { useEffect, useState } from "react";
import { EventExplorer } from "@/components/events/event-explorer";
import { publishedEventsLive } from "@/lib/content/live";
import { shuffleItems } from "@/lib/content/home-display";
import { publicEventLists } from "@/lib/calendar";
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
  const [programs, setPrograms] = useState(initialPrograms);

  useEffect(() => {
    setOngoing(shuffleItems(initialOngoing));
    setUpcoming(shuffleItems(initialUpcoming));
    setPrograms(initialPrograms);
  }, [initialOngoing, initialUpcoming, initialPrograms]);

  useEffect(() => {
    publishedEventsLive().then((all) => {
      if (all.length === 0) return;
      const lists = publicEventLists(all);
      setOngoing(shuffleItems(lists.ongoing));
      setUpcoming(shuffleItems(lists.upcoming));
      setPrograms(all);
    });
  }, []);

  return (
    <EventExplorer ongoing={ongoing} upcoming={upcoming} programs={programs} weather={weather} />
  );
}
