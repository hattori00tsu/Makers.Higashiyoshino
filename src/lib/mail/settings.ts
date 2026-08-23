import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { defaultMailTemplates, mergeMailTemplates, type MailTemplates } from "@/lib/mail/templates";

export type MailSettings = {
  notifyEmail: string;
  mailApplications: boolean;
  mailArtistDecision: boolean;
  mailAdminPending: boolean;
  mailArtistApplications: boolean;
  copy: MailTemplates;
};

export const defaultMailSettings = (): MailSettings => ({
  notifyEmail: "",
  mailApplications: true,
  mailArtistDecision: true,
  mailAdminPending: true,
  mailArtistApplications: true,
  copy: defaultMailTemplates(),
});

const KEY = "hy-mail-settings-v1";

export function loadLocalMailSettings(): MailSettings {
  if (typeof window === "undefined") return defaultMailSettings();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultMailSettings();
    const parsed = JSON.parse(raw) as Partial<MailSettings>;
    return {
      ...defaultMailSettings(),
      ...parsed,
      copy: mergeMailTemplates(parsed.copy),
    };
  } catch {
    return defaultMailSettings();
  }
}

export function saveLocalMailSettings(settings: MailSettings) {
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

export function mapMailSettings(row: Record<string, unknown> | null): MailSettings {
  if (!row) return defaultMailSettings();
  return {
    notifyEmail: String(row.notify_email ?? row.notifyEmail ?? ""),
    mailApplications: row.mail_applications !== false && row.mailApplications !== false,
    mailArtistDecision: row.mail_artist_decision !== false && row.mailArtistDecision !== false,
    mailAdminPending: row.mail_admin_pending !== false && row.mailAdminPending !== false,
    mailArtistApplications: row.mail_artist_applications !== false && row.mailArtistApplications !== false,
    copy: mergeMailTemplates(row.mail_copy ?? row.copy),
  };
}

export async function loadMailSettings(preview?: boolean): Promise<MailSettings> {
  if (preview || !isSupabaseConfigured()) return loadLocalMailSettings();
  const supabase = createBrowserSupabase();
  if (!supabase) return defaultMailSettings();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "notify_email, mail_applications, mail_artist_decision, mail_admin_pending, mail_artist_applications, mail_copy",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    const { data: flags } = await supabase.rpc("mail_flags");
    return mapMailSettings((flags as Record<string, unknown> | null) ?? null);
  }
  return mapMailSettings(data as Record<string, unknown>);
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
      mail_copy: settings.copy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function loadMailFlags() {
  if (!isSupabaseConfigured()) {
    return typeof window === "undefined" ? defaultMailSettings() : loadLocalMailSettings();
  }
  const supabase = createBrowserSupabase();
  if (!supabase) return defaultMailSettings();
  const { data } = await supabase.rpc("mail_flags");
  return mapMailSettings((data as Record<string, unknown> | null) ?? null);
}
