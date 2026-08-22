import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/account/types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ ok: true });

  if (isSupabaseConfigured()) {
    const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    await supabase.auth.signOut();
  }

  response.cookies.set(PREVIEW_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
