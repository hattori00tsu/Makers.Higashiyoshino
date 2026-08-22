import {
  artists as seedArtists,
  googleMapsSearchUrl,
  spots as seedSpots,
  spotMapsUrl,
  village,
  type Artist,
  type SpotItem,
} from "@/data/site";
import { coordsFromMapsUrl, isGoogleMapsUrl } from "@/lib/maps-url";

export type PlaceKind = "studio" | "spot";

export type MapPlace = {
  id: string;
  kind: PlaceKind;
  name: string;
  subtitle: string;
  mapsUrl: string;
  href: string;
  lat?: number;
  lng?: number;
};

const kindLabel: Record<PlaceKind, string> = {
  studio: "工房",
  spot: "周辺",
};

export const placeKindLabel = kindLabel;

export function mapPlaces(
  artistItems: Artist[] = seedArtists,
  spotItems: SpotItem[] = seedSpots,
): MapPlace[] {
  const studios: MapPlace[] = artistItems.map((artist) => ({
    id: `studio:${artist.slug}`,
    kind: "studio",
    name: artist.name,
    subtitle: `${artist.genre} · ${artist.area}`,
    href: `/artists/${artist.slug}`,
    ...studioPin(artist),
  }));

  const extras: MapPlace[] = spotItems.map((spot) => {
    const mapsUrl = spotMapsUrl(spot);
    const coords = coordsFromMapsUrl(mapsUrl);
    return {
      id: `spot:${spot.name}`,
      kind: "spot",
      name: spot.name,
      subtitle: spot.category,
      mapsUrl,
      href: "/guide",
      ...coords,
    };
  });

  return [...studios, ...extras];
}

function studioMapsUrl(artist: Artist) {
  const query = (artist.studio?.query ?? "").trim();
  if (isGoogleMapsUrl(query)) return query;
  if (query) return googleMapsSearchUrl(query);
  const address = (artist.studio?.address ?? "").trim();
  if (address) return googleMapsSearchUrl(address);
  return village.mapsUrl;
}

function studioPin(artist: Artist) {
  const mapsUrl = studioMapsUrl(artist);
  const fromUrl = coordsFromMapsUrl(mapsUrl) ?? coordsFromMapsUrl(artist.studio?.query ?? "");
  if (fromUrl) return { mapsUrl, ...fromUrl };
  const lat = artist.studio?.lat;
  const lng = artist.studio?.lng;
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (Math.abs(lat - village.lat) > 0.0001 || Math.abs(lng - village.lng) > 0.0001)
  ) {
    return { mapsUrl, lat, lng };
  }
  return { mapsUrl };
}

export function findMapPlace(places: MapPlace[], focus?: string) {
  if (!focus) return undefined;
  return (
    places.find((place) => place.id === focus) ??
    places.find((place) => place.id === `studio:${focus}`) ??
    places.find((place) => place.id.endsWith(`:${focus}`))
  );
}
