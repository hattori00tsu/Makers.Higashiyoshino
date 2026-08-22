import { createServerSupabase } from "@/lib/supabase/server";
import { defaultMailSettings, type MailSettings } from "@/lib/mail/settings";

export async function loadMailFlagsServer(): Promise<MailSettings> {
  const supabase = await createServerSupabase();
  if (!supabase) return defaultMailSettings();
  const { data } = await supabase.rpc("mail_flags");
  const row = (typeof data === "string" ? JSON.parse(data) : data) as Record<string, unknown> | null;
  if (!row) return defaultMailSettings();
  return {
    notifyEmail: String(row.notify_email ?? ""),
    mailApplications: row.mail_applications !== false,
    mailArtistDecision: row.mail_artist_decision !== false,
    mailAdminPending: row.mail_admin_pending !== false,
    mailArtistApplications: row.mail_artist_applications !== false,
  };
}
