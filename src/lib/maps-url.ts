export type MapCoords = {
  lat: number;
  lng: number;
};

export function isGoogleMapsUrl(url: string) {
  return /(google\.[^/]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(url ?? ""));
}

export function isShortMapsUrl(url: string) {
  return /(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url);
}

function pair(lat: string | number, lng: string | number): MapCoords | null {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  return { lat: la, lng: ln };
}

/** Google マップ URL から緯度経度を取る。場所名だけの検索や cid は対象外。 */
export function coordsFromMapsUrl(url: string): MapCoords | null {
  const value = String(url ?? "").trim();
  if (!value) return null;

  const pin = value.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pin) return pair(pin[1], pin[2]);

  const camera = value.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  if (camera) return pair(camera[2], camera[1]);

  const at = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return pair(at[1], at[2]);

  try {
    const parsed = new URL(value);
    const q = parsed.searchParams.get("q") || parsed.searchParams.get("query") || parsed.searchParams.get("ll");
    if (q) {
      const match = q.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (match) return pair(match[1], match[2]);
    }
    const center = parsed.searchParams.get("center");
    if (center) {
      const match = center.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (match) return pair(match[1], match[2]);
    }
  } catch {
    /* ignore malformed URLs */
  }

  return null;
}

export async function expandMapsUrl(url: string): Promise<string> {
  const value = url.trim();
  if (!value || !isShortMapsUrl(value)) return value;

  try {
    const res = await fetch(value, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    const resolved = res.url && isGoogleMapsUrl(res.url) ? res.url : value;
    if (coordsFromMapsUrl(resolved)) return resolved;
    if (isShortMapsUrl(resolved) || !coordsFromMapsUrl(resolved)) {
      const html = await res.text();
      const found = html.match(/https:\/\/www\.google\.[a-z.]+\/maps\/[^"'<>\\\s]+/i);
      if (found?.[0]) return found[0].replace(/&amp;/g, "&");
    }
    return resolved;
  } catch {
    return value;
  }
}

export async function resolveMapsCoords(url: string): Promise<MapCoords | null> {
  const direct = coordsFromMapsUrl(url);
  if (direct) return direct;
  if (!isGoogleMapsUrl(url)) return null;
  return coordsFromMapsUrl(await expandMapsUrl(url));
}
