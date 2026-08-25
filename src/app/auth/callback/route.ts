import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerSession } from "@/lib/account/server";
import { pathAfterLogin } from "@/lib/account/paths";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next") ?? "/visit";
  const requested = nextParam.startsWith("/") ? nextParam : "/visit";
  const supabase = await createServerSupabase();

  if (supabase && code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (supabase && tokenHash && type) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  }

  const session = await getServerSession();
  return NextResponse.redirect(new URL(pathAfterLogin(session, requested), url.origin));
}
