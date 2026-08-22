"use client";

import { useEffect, useState } from "react";
import { EventList } from "@/components/events/event-list";
import { publishedEventsLive } from "@/lib/content/live";
import { archiveBySeries, publicEventLists } from "@/lib/calendar";
import type { EventItem } from "@/data/site";

type Props = {
  initialItems: EventItem[];
  initialPrograms?: EventItem[];
  series?: string;
};

export function ArchiveBrowser({ initialItems, initialPrograms = [], series = "" }: Props) {
  const [items, setItems] = useState(initialItems);
  const [programs, setPrograms] = useState(initialPrograms);

  useEffect(() => {
    publishedEventsLive().then((all) => {
      if (all.length === 0) return;
      setItems(archiveBySeries(publicEventLists(all).archive, series));
      setPrograms(all);
    });
  }, [series]);

  if (items.length === 0) {
    return (
      <p className="text-sm leading-7 text-sumi-soft">
        {series ? "このシリーズの過去の催しはまだありません。" : "過去の催しはまだありません。"}
      </p>
    );
  }

  return <EventList items={items} programs={programs} nestedPrograms={false} />;
}
