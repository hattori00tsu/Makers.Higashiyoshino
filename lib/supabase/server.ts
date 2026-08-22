import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

function publicCookieAdapter() {
  return {
    getAll() {
      return [] as { name: string; value: string }[];
    },
    setAll() {},
  };
}

/** 公開データの読み取り用。cookies() を触らないので、公開ページの RSC が 500 にならない */
export function createPublicSupabase() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: publicCookieAdapter(),
  });
}

export async function createServerSupabase() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies.
        }
      },
    },
  });
}
