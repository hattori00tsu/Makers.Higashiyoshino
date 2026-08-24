import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthIdentity = {
  id: string;
  email: string;
};

/**
 * JWT をローカル検証してユーザー ID を返す。
 * getUser() のように毎回 Auth API へは飛ばない（非対称鍵の場合）。
 */
export async function getAuthIdentity(supabase: SupabaseClient): Promise<AuthIdentity | null> {
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  const email = data.claims.email;
  return {
    id: sub,
    email: typeof email === "string" ? email : "",
  };
}
