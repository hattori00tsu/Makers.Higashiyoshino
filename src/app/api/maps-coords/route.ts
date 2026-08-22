import { isGoogleMapsUrl, resolveMapsCoords, type MapCoords } from "@/lib/maps-url";

const cacheHeaders = { "Cache-Control": "public, max-age=86400" };

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!isGoogleMapsUrl(url)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const coords = await resolveMapsCoords(url);
  if (!coords) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(coords, { headers: cacheHeaders });
}

export async function POST(request: Request) {
  let urls: unknown;
  try {
    const body = (await request.json()) as { urls?: unknown };
    urls = body.urls;
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (!Array.isArray(urls)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const unique = [...new Set(urls.map((item) => String(item).trim()).filter((item) => isGoogleMapsUrl(item)))];
  const coords: Record<string, MapCoords> = {};
  await Promise.all(
    unique.map(async (url) => {
      const found = await resolveMapsCoords(url);
      if (found) coords[url] = found;
    }),
  );
  return Response.json({ coords }, { headers: cacheHeaders });
}
