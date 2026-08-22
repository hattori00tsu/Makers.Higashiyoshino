import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/config";

export function createServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!isSupabaseConfigured() || !key.startsWith("eyJ")) return null;
  return createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
