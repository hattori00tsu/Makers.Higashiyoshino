"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlaceMap, PlaceMapLegend, type PlaceMarker } from "@/components/map/place-map";
import { loadSpotsLive } from "@/lib/content/live";
import {
  findMapPlace,
  mapPlaces,
  placeKindLabel,
  type MapPlace,
  type PlaceKind,
} from "@/lib/places";
import type { Artist, SpotItem } from "@/data/site";

type Props = {
  focus?: string;
  artists?: Artist[];
  spots?: SpotItem[];
};

const filters: { id: "all" | PlaceKind; label: string }[] = [];

export function VillageMap({ focus, artists = [], spots: initialSpots = [] }: Props) {
  const [spots, setSpots] = useState<SpotItem[]>(initialSpots);
  const [kind, setKind] = useState<"all" | PlaceKind>("all");
  const [activeId, setActiveId] = useState(focus ?? "");

  useEffect(() => {
    loadSpotsLive().then(setSpots);
  }, []);

  const places = useMemo(() => mapPlaces(artists, spots), [artists, spots]);
  const visible = useMemo(
    () => places.filter((place) => kind === "all" || place.kind === kind),
    [places, kind],
  );
  const active = findMapPlace(visible, activeId);
  const markers: PlaceMarker[] = useMemo(
    () =>
      visible.map((place) => ({
        id: place.id,
        title: place.name,
        kind: place.kind,
        url: place.mapsUrl,
        lat: place.lat,
        lng: place.lng,
      })),
    [visible],
  );

  function select(place: MapPlace) {
    if (kind !== "all" && kind !== place.kind) setKind("all");
    setActiveId(place.id);
  }

  return (
    <div>
      {filters.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1 text-[13px] tracking-[0.16em]">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={`px-3 py-2 ${kind === item.id ? "text-sumi" : "text-sumi-soft"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <PlaceMap
        title={active?.name ?? "村内"}
        markers={markers}
        activeId={activeId}
        onSelect={setActiveId}
        cooperativeGestures={false}
        className="h-[52vh] min-h-[320px] w-full md:h-[62vh]"
      />
      <PlaceMapLegend kinds={markers.map((marker) => marker.kind)} />

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {visible.map((place) => (
          <li key={place.id}>
            <div className="flex items-center justify-between gap-4 py-4">
              <button type="button" onClick={() => select(place)} className="text-left">
                <p className="text-[11px] tracking-[0.16em] text-tsuchi">
                  {placeKindLabel[place.kind]}
                </p>
                <p className="mt-1 font-serif text-lg tracking-wide">{place.name}</p>
                <p className="mt-1 text-sm text-sumi-soft">{place.subtitle}</p>
              </button>
              <div className="flex shrink-0 flex-col items-end gap-2 text-[12px] tracking-[0.12em]">
                {place.mapsUrl ? (
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sumi-soft underline decoration-line underline-offset-4"
                  >
                    Google マップ
                  </a>
                ) : null}
                <Link href={place.href} className="text-sugi">
                  詳しく
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
