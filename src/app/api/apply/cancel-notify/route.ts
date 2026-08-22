import { NextResponse } from "next/server";
import { sendResendMail } from "@/lib/mail/resend";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/account/server";

type Body = {
  eventTitle?: string;
  eventSlug?: string;
  name?: string;
  email?: string;
  partySize?: number;
  sessionLabel?: string;
};

export async function POST(request: Request) {
  const user = await getServerSession();
  if (!user) {
    return NextResponse.json({ emailed: false }, { status: 401 });
  }
  const body = (await request.json()) as Body;
  const email = body.email?.trim();
  const name = body.name?.trim();
  const eventTitle = body.eventTitle?.trim();
  if (!email || !name || !eventTitle) {
    return NextResponse.json({ emailed: false }, { status: 400 });
  }

  const flags = await loadMailFlagsServer();
  const session = body.sessionLabel ? `日程：${body.sessionLabel}` : "";
  const party = body.partySize ? `人数：${body.partySize}名` : "";
  const origin = new URL(request.url).origin;

  let emailed = false;
  if (flags.mailApplications) {
    emailed = await sendResendMail({
      to: email,
      subject: `【東吉野】${eventTitle}のキャンセルを受け付けました`,
      text: `${name} さま\n\n${eventTitle}のキャンセルを受け付けました。\n${session}\n${party}\n\n東吉野村アーティストコミュニティ\n`,
    });
  }

  if (flags.mailArtistApplications) {
    const supabase = await createServerSupabase();
    const artists =
      supabase && body.eventSlug
        ? ((
            await supabase.rpc("artist_emails_for_event", { p_slug: body.eventSlug })
          ).data as { email?: string; name?: string }[] | null)
        : [];
    for (const artist of artists ?? []) {
      if (!artist.email) continue;
      await sendResendMail({
        to: artist.email,
        subject: `【東吉野】${eventTitle}にキャンセルがありました`,
        text: `${artist.name || "作家"} さま\n\n${eventTitle}の予約がキャンセルされました。\n\nお名前：${name}\nメール：${email}\n${session}\n${party}\n\n予約者の一覧：\n${origin}/mypage/applications\n`,
      });
    }
  }

  if (flags.notifyEmail) {
    await sendResendMail({
      to: flags.notifyEmail,
      subject: `【東吉野】${eventTitle}にキャンセルがありました`,
      text: `${eventTitle}の予約がキャンセルされました。\n\nお名前：${name}\nメール：${email}\n${session}\n${party}\n`,
    });
  }

  return NextResponse.json({ emailed });
}
