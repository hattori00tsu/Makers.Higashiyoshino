"use client";

import dynamic from "next/dynamic";
import { EventPlaceList } from "@/components/events/event-place-list";
import type { PlaceOption } from "@/data/site";

const EventPlacesMap = dynamic(
  () => import("@/components/events/event-places-map").then((mod) => mod.EventPlacesMap),
  { ssr: false },
);

export function EventAccessSection({
  archived,
  venues,
  parkings,
}: {
  archived: boolean;
  venues: PlaceOption[];
  parkings: PlaceOption[];
}) {
  if (archived) {
    return <EventPlaceList venues={venues} parkings={parkings} />;
  }
  return <EventPlacesMap venues={venues} parkings={parkings} />;
}
