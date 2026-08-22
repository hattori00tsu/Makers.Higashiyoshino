"use client";

import { useMemo, useState } from "react";
import { PlaceMap, PlaceMapLegend, type PlaceMarker } from "@/components/map/place-map";
import { isGoogleMapsUrl } from "@/lib/maps-url";
import type { PlaceOption } from "@/data/site";

type Props = {
  venues: PlaceOption[];
  parkings: PlaceOption[];
};

function toMarkers(places: PlaceOption[], kind: PlaceMarker["kind"]): PlaceMarker[] {
  return places
    .filter((place) => place.url && isGoogleMapsUrl(place.url))
    .map((place) => ({
      id: `${kind}:${place.id || place.title || place.url}`,
      title: place.title,
      kind,
      url: place.url,
    }));
}

export function EventPlacesMap({ venues, parkings }: Props) {
  const [activeId, setActiveId] = useState("");
  const markers = useMemo(
    () => [...toMarkers(venues, "venue"), ...toMarkers(parkings, "parking")],
    [venues, parkings],
  );

  if (venues.length === 0 && parkings.length === 0) return null;

  return (
    <div className="mt-10">
      {markers.length > 0 ? (
        <>
          <PlaceMap
            title="会場と駐車場"
            markers={markers}
            activeId={activeId}
            onSelect={setActiveId}
          />
          <PlaceMapLegend kinds={markers.map((marker) => marker.kind)} />
        </>
      ) : null}
      <PlaceList label="会場" places={venues} markerKind="venue" onSelect={setActiveId} />
      <PlaceList label="駐車場" places={parkings} markerKind="parking" onSelect={setActiveId} />
    </div>
  );
}

function PlaceList({
  label,
  places,
  markerKind,
  onSelect,
}: {
  label: string;
  places: PlaceOption[];
  markerKind: PlaceMarker["kind"];
  onSelect: (id: string) => void;
}) {
  if (places.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-[11px] tracking-[0.22em] text-tsuchi">{label}</p>
      <ul className="mt-3 space-y-1 text-sm leading-7 text-sumi-soft">
        {places.map((place) => {
          const id = `${markerKind}:${place.id || place.title || place.url}`;
          return (
            <li key={place.id || place.title}>
              {place.url ? (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-4"
                  onClick={() => onSelect(id)}
                >
                  {place.title}
                </a>
              ) : (
                place.title
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
