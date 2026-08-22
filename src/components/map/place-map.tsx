"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  coordsFromMapsUrl,
  isGoogleMapsUrl,
  type MapCoords,
} from "@/lib/maps-url";
import { village } from "@/data/site";
import type { Map as MapLibreMap, Marker, Popup, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type PlaceMarkerKind = "venue" | "parking" | "studio" | "spot";

export type PlaceMarker = {
  id: string;
  title: string;
  kind: PlaceMarkerKind;
  url?: string;
  lat?: number;
  lng?: number;
};

type Props = {
  title: string;
  markers: PlaceMarker[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  cooperativeGestures?: boolean;
};

const kindLabel: Record<PlaceMarkerKind, string> = {
  venue: "会場",
  parking: "駐車場",
  studio: "工房",
  spot: "周辺",
};

/** OpenStreetMap の街地図。道路が見やすく、タイルも安定して読み込める */
const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function hasCoords(marker: PlaceMarker): marker is PlaceMarker & MapCoords {
  return Number.isFinite(marker.lat) && Number.isFinite(marker.lng);
}

async function fillCoords(markers: PlaceMarker[]): Promise<PlaceMarker[]> {
  const withDirect = markers.map((marker) => {
    if (hasCoords(marker)) return marker;
    const fromUrl = marker.url ? coordsFromMapsUrl(marker.url) : null;
    return fromUrl ? { ...marker, ...fromUrl } : marker;
  });
  const missing = withDirect.filter((marker) => !hasCoords(marker) && marker.url && isGoogleMapsUrl(marker.url));
  if (missing.length === 0) return withDirect;

  const urls = [...new Set(missing.map((marker) => marker.url as string))];
  let found: Record<string, MapCoords> = {};
  try {
    if (urls.length === 1) {
      const res = await fetch(`/api/maps-coords?url=${encodeURIComponent(urls[0])}`);
      if (res.ok) found = { [urls[0]]: (await res.json()) as MapCoords };
    } else {
      const res = await fetch("/api/maps-coords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      if (res.ok) {
        const data = (await res.json()) as { coords?: Record<string, MapCoords> };
        found = data.coords ?? {};
      }
    }
  } catch {
    /* 短縮 URL が展開できなくても、取れたピンだけ出す */
  }

  return withDirect.map((marker) => {
    if (hasCoords(marker) || !marker.url) return marker;
    const coords = found[marker.url];
    return coords ? { ...marker, ...coords } : marker;
  });
}

export function PlaceMap({
  title,
  markers,
  activeId,
  onSelect,
  className,
  cooperativeGestures = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<{ markers: Marker[]; popup: Popup | null }>({ markers: [], popup: null });
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);
  const [resolved, setResolved] = useState<PlaceMarker[]>(markers);
  onSelectRef.current = onSelect;

  const signature = useMemo(
    () => markers.map((marker) => [marker.id, marker.url, marker.lat, marker.lng].join(":")).join("|"),
    [markers],
  );

  useEffect(() => {
    let active = true;
    fillCoords(markers).then((next) => {
      if (active) setResolved(next);
    });
    return () => {
      active = false;
    };
    // signature が同じなら再取得しない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const pins = useMemo(() => resolved.filter(hasCoords), [resolved]);
  const pinKey = pins.map((pin) => pin.id).join("|");
  const showMap = pins.length > 0;

  useEffect(() => {
    if (!showMap) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: MapLibreMap | undefined;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [village.lng, village.lat],
        zoom: 13,
        cooperativeGestures,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      const markReady = () => {
        if (!cancelled) setMapReady(true);
      };
      if (map.loaded()) markReady();
      else map.once("load", markReady);
      map.once("error", markReady);
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      overlayRef.current.markers.forEach((marker) => marker.remove());
      overlayRef.current.popup?.remove();
      overlayRef.current = { markers: [], popup: null };
      map?.remove();
      mapRef.current = null;
    };
  }, [cooperativeGestures, showMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || pins.length === 0) return;
    let cancelled = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || mapRef.current !== map) return;

      overlayRef.current.markers.forEach((marker) => marker.remove());
      overlayRef.current.popup?.remove();

      const popup = new maplibregl.Popup({ offset: 16, closeButton: false });
      const nextMarkers = pins.map((pin) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "place-map-pin";
        el.dataset.kind = pin.kind;
        el.dataset.active = pin.id === activeId ? "true" : "false";
        el.setAttribute("aria-label", `${kindLabel[pin.kind]} ${pin.title}`);
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current?.(pin.id);
          popup.setDOMContent(popupContent(pin)).setLngLat([pin.lng, pin.lat]).addTo(map);
        });
        return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(map);
      });
      overlayRef.current = { markers: nextMarkers, popup };

      if (pins.length === 1) {
        map.jumpTo({ center: [pins[0].lng, pins[0].lat], zoom: 15 });
        return;
      }
      const bounds = new maplibregl.LngLatBounds();
      pins.forEach((pin) => bounds.extend([pin.lng, pin.lat]));
      map.fitBounds(bounds, { padding: 56, maxZoom: 16, duration: 0 });
    })();

    return () => {
      cancelled = true;
    };
    // activeId の見た目は別 effect で更新し、全体の fit はピン集合が変わったときだけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, pinKey]);

  useEffect(() => {
    overlayRef.current.markers.forEach((marker, index) => {
      const el = marker.getElement();
      const pin = pins[index];
      if (!el || !pin) return;
      el.dataset.active = pin.id === activeId ? "true" : "false";
    });

    const map = mapRef.current;
    const popup = overlayRef.current.popup;
    const pin = pins.find((item) => item.id === activeId);
    if (!map || !mapReady || !pin) return;
    map.easeTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 15), duration: 600 });
    popup?.setDOMContent(popupContent(pin)).setLngLat([pin.lng, pin.lat]).addTo(map);
  }, [activeId, mapReady, pins]);

  if (!showMap) return null;

  return (
    <div className="overflow-hidden border border-line">
      <div
        ref={containerRef}
        role="region"
        aria-label={`${title}の地図`}
        className={className ?? "h-64 w-full md:h-80"}
      />
    </div>
  );
}

export const placeMarkerKindLabel = kindLabel;

export function PlaceMapLegend({ kinds }: { kinds: PlaceMarkerKind[] }) {
  const unique = [...new Set(kinds)];
  if (unique.length < 2) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] tracking-[0.12em] text-sumi-soft">
      {unique.map((kind) => (
        <li key={kind} className="flex items-center gap-2">
          <span className="place-map-pin-swatch" data-kind={kind} />
          {kindLabel[kind]}
        </li>
      ))}
    </ul>
  );
}

function popupContent(pin: PlaceMarker & MapCoords) {
  const root = document.createElement("div");
  root.className = "place-map-popup";
  const kind = document.createElement("p");
  kind.className = "place-map-popup-kind";
  kind.textContent = kindLabel[pin.kind];
  const name = document.createElement("p");
  name.className = "place-map-popup-title";
  name.textContent = pin.title;
  root.append(kind, name);
  if (pin.url) {
    const link = document.createElement("a");
    link.href = pin.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Google マップで開く";
    root.append(link);
  }
  return root;
}
