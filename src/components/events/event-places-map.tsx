"use client";

import { useMemo, useState } from "react";
import { PlaceMap, PlaceMapLegend, placeMarkerId, placesToMarkers, type PlaceMarker } from "@/components/map/place-map";
import type { PlaceOption } from "@/data/site";
import { useMessages } from "@/lib/i18n/provider";

type Props = {
  venues: PlaceOption[];
  parkings: PlaceOption[];
};

export function EventPlacesMap({ venues, parkings }: Props) {
  const t = useMessages();
  const [activeId, setActiveId] = useState("");
  const markers = useMemo(
    () => [...placesToMarkers(venues, "venue"), ...placesToMarkers(parkings, "parking")],
    [venues, parkings],
  );

  if (venues.length === 0 && parkings.length === 0) return null;

  return (
    <div className="mt-10">
      {markers.length > 0 ? (
        <>
          <PlaceMap
            title={t.events.venuesAndParking}
            markers={markers}
            activeId={activeId}
            onSelect={setActiveId}
          />
          <PlaceMapLegend kinds={markers.map((marker) => marker.kind)} />
        </>
      ) : null}
      <PlaceList label={t.events.venuesHeading} places={venues} markerKind="venue" onSelect={setActiveId} />
      <PlaceList label={t.events.parking} places={parkings} markerKind="parking" onSelect={setActiveId} />
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
          const id = placeMarkerId(markerKind, place);
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
