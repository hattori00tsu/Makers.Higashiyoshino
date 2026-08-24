import { createServerSupabase } from "@/lib/supabase/server";
import { defaultMailSettings, mapMailSettings, type MailSettings } from "@/lib/mail/settings";

export async function loadMailFlagsServer(): Promise<MailSettings> {
  const supabase = await createServerSupabase();
  if (!supabase) return defaultMailSettings();
  const { data } = await supabase.rpc("mail_flags");
  const row = (typeof data === "string" ? JSON.parse(data) : data) as Record<string, unknown> | null;
  return mapMailSettings(row);
}
