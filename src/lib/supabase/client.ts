import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl(), supabaseAnonKey());
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl(), supabaseAnonKey());
  }
  return browserClient;
}
