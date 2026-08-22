import { NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/account/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const allowed = new Set(["preview-visitor", "preview-artist", "preview-admin"]);

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    return NextResponse.json({ error: "preview disabled" }, { status: 400 });
  }
  const body = (await request.json()) as { id?: string };
  if (!body.id || !allowed.has(body.id)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_COOKIE, body.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
