import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { getAuthIdentity } from "@/lib/supabase/identity";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return { response, userId: null as string | null };
  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
    return { response, userId: null as string | null };
  }

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const user = await getAuthIdentity(supabase);
    return { response, userId: user?.id ?? null };
  } catch {
    return { response, userId: null as string | null };
  }
}
