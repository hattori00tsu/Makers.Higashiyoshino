import { NextResponse } from "next/server";
import { sendResendMail } from "@/lib/mail/resend";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { createServerSupabase } from "@/lib/supabase/server";

type Body = {
  name?: string;
  artistId?: string;
  status?: "approved" | "rejected";
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const name = body.name?.trim();
  const artistId = body.artistId?.trim();
  const status = body.status;
  if (!name || !artistId || (status !== "approved" && status !== "rejected")) {
    return NextResponse.json({ emailed: false }, { status: 400 });
  }

  const flags = await loadMailFlagsServer();
  if (!flags.mailArtistDecision) {
    return NextResponse.json({ emailed: false });
  }

  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ emailed: false });
  const { data: email, error } = await supabase.rpc("admin_email_for_artist", {
    p_artist_id: artistId,
  });
  if (error || !email) {
    return NextResponse.json({ emailed: false });
  }

  const origin = new URL(request.url).origin;
  const emailed = await sendResendMail({
    to: String(email),
    subject:
      status === "approved"
        ? "【東吉野】作家登録を承認しました"
        : "【東吉野】作家登録の申請について",
    text:
      status === "approved"
        ? `${name} さま\n\n東吉野村アーティストコミュニティの作家登録を承認しました。マイページからプロフィールと作品を整えられます。\n${origin}/mypage\n`
        : `${name} さま\n\n今回の申請は見送らせていただきました。内容を直して、再度お申し込みください。\n${origin}/register\n`,
  });

  return NextResponse.json({ emailed });
}
