"use client";

import { useMemo, useState } from "react";
import {
  PlaceMap,
  PlaceMapLegend,
  placeMarkerId,
  placesToMarkers,
  type PlaceMarker,
} from "@/components/map/place-map";
import { villageVenueOption, type PlaceOption } from "@/data/site";
import { localizePlaces } from "@/lib/i18n/content";
import { useCatalog, useLocale, useMessages } from "@/lib/i18n/provider";

export function VillageMap() {
  const t = useMessages();
  const locale = useLocale();
  const options = useCatalog();
  const venues = useMemo(() => {
    const fromCatalog = localizePlaces(options.venues, locale, options.venues);
    return fromCatalog.length ? fromCatalog : [villageVenueOption()];
  }, [locale, options.venues]);
  const parkings = useMemo(
    () => localizePlaces(options.parkings, locale, options.parkings),
    [locale, options.parkings],
  );
  const [activeId, setActiveId] = useState("");
  const markers = useMemo(
    () => [...placesToMarkers(venues, "venue"), ...placesToMarkers(parkings, "parking")],
    [venues, parkings],
  );

  return (
    <div>
      <PlaceMap
        title={t.map.title}
        markers={markers}
        activeId={activeId}
        onSelect={setActiveId}
        showWhenEmpty
        className="h-[52vh] min-h-[320px] w-full md:h-[62vh]"
      />
      <PlaceMapLegend kinds={markers.map((marker) => marker.kind)} />
      <PlaceList label={t.map.venues} places={venues} markerKind="venue" onSelect={setActiveId} />
      <PlaceList label={t.map.parking} places={parkings} markerKind="parking" onSelect={setActiveId} />
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
