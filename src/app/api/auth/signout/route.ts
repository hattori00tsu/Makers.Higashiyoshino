import { NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/account/types";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
