import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type MailSettings = {
  notifyEmail: string;
  mailApplications: boolean;
  mailArtistDecision: boolean;
  mailAdminPending: boolean;
  mailArtistApplications: boolean;
};

export const defaultMailSettings = (): MailSettings => ({
  notifyEmail: "",
  mailApplications: true,
  mailArtistDecision: true,
  mailAdminPending: true,
  mailArtistApplications: true,
});

const KEY = "hy-mail-settings-v1";

export function loadLocalMailSettings(): MailSettings {
  if (typeof window === "undefined") return defaultMailSettings();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultMailSettings();
    const parsed = JSON.parse(raw) as Partial<MailSettings>;
    return { ...defaultMailSettings(), ...parsed };
  } catch {
    return defaultMailSettings();
  }
}

export function saveLocalMailSettings(settings: MailSettings) {
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

function mapRow(row: Record<string, unknown> | null): MailSettings {
  if (!row) return defaultMailSettings();
  return {
    notifyEmail: String(row.notify_email ?? row.notifyEmail ?? ""),
    mailApplications: row.mail_applications !== false && row.mailApplications !== false,
    mailArtistDecision: row.mail_artist_decision !== false && row.mailArtistDecision !== false,
    mailAdminPending: row.mail_admin_pending !== false && row.mailAdminPending !== false,
    mailArtistApplications: row.mail_artist_applications !== false && row.mailArtistApplications !== false,
  };
}

export async function loadMailSettings(preview?: boolean): Promise<MailSettings> {
  if (preview || !isSupabaseConfigured()) return loadLocalMailSettings();
  const supabase = createBrowserSupabase();
  if (!supabase) return defaultMailSettings();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    const { data: flags } = await supabase.rpc("mail_flags");
    return mapRow((flags as Record<string, unknown> | null) ?? null);
  }
  return mapRow(data as Record<string, unknown>);
}

export async function saveMailSettings(settings: MailSettings, preview?: boolean) {
  if (preview || !isSupabaseConfigured()) {
    saveLocalMailSettings(settings);
    return;
  }
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      notify_email: settings.notifyEmail.trim() || null,
      mail_applications: settings.mailApplications,
      mail_artist_decision: settings.mailArtistDecision,
      mail_admin_pending: settings.mailAdminPending,
      mail_artist_applications: settings.mailArtistApplications,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function loadMailFlags() {
  if (!isSupabaseConfigured()) {
    const local = typeof window === "undefined" ? defaultMailSettings() : loadLocalMailSettings();
    return local;
  }
  const supabase = createBrowserSupabase();
  if (!supabase) return defaultMailSettings();
  const { data } = await supabase.rpc("mail_flags");
  return mapRow((data as Record<string, unknown> | null) ?? null);
}
