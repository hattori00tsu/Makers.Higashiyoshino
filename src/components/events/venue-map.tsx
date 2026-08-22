"use client";

import { PlaceMap, type PlaceMarker } from "@/components/map/place-map";
import { isGoogleMapsUrl } from "@/lib/maps-url";

export { isGoogleMapsUrl };

type Props = {
  title: string;
  url?: string;
  className?: string;
  iframeClassName?: string;
};

export function VenueMap({ title, url, className, iframeClassName }: Props) {
  const recorded = url?.trim() ?? "";
  if (!recorded) return null;

  const markers: PlaceMarker[] = [
    {
      id: recorded,
      title,
      kind: "studio",
      url: recorded,
    },
  ];

  return (
    <PlaceMap
      title={title}
      markers={markers}
      className={className ?? iframeClassName ?? "h-64 w-full md:h-80"}
    />
  );
}
