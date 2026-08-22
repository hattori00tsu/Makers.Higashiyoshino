import { isGoogleMapsUrl, resolveMapsCoords, type MapCoords } from "@/lib/maps-url";

const cacheHeaders = { "Cache-Control": "public, max-age=86400" };

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!isGoogleMapsUrl(url)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const coords = await resolveMapsCoords(url);
    if (!coords) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return Response.json(coords, { headers: cacheHeaders });
  } catch {
    return Response.json({ error: "timeout" }, { status: 504 });
  }
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
    unique.map(async (item) => {
      try {
        const found = await resolveMapsCoords(item);
        if (found) coords[item] = found;
      } catch {
        /* 1件の失敗で全体を止めない */
      }
    }),
  );
  return Response.json({ coords }, { headers: cacheHeaders });
}
