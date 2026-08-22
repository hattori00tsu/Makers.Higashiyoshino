import { NextResponse } from "next/server";
import { sendResendMail } from "@/lib/mail/resend";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { createServerSupabase } from "@/lib/supabase/server";

type Body = {
  eventTitle?: string;
  eventSlug?: string;
  name?: string;
  email?: string;
  phone?: string;
  partySize?: number;
  note?: string;
  sessionLabel?: string;
};

export async function POST(request: Request) {
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
  const phone = body.phone?.trim() ? `電話：${body.phone.trim()}` : "";
  const note = body.note?.trim() ? `連絡事項：${body.note.trim()}` : "";
  const origin = new URL(request.url).origin;

  let emailed = false;
  if (flags.mailApplications) {
    emailed = await sendResendMail({
      to: email,
      subject: `【東吉野】${eventTitle}の予約が確定しました`,
      text: `${name} さま\n\n${eventTitle}の予約が確定しました。\n${session}\n${party}\n\n当日まで、このメールを控えておいてください。\n東吉野村アーティストコミュニティ\n`,
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
        subject: `【東吉野】${eventTitle}に申込みがありました`,
        text: `${artist.name || "作家"} さま\n\n${eventTitle}に参加の申込みがありました。\n\nお名前：${name}\nメール：${email}\n${phone}\n${session}\n${party}\n${note}\n\n予約者の一覧：\n${origin}/mypage/applications\n`,
      });
    }
  }

  if (flags.notifyEmail) {
    await sendResendMail({
      to: flags.notifyEmail,
      subject: `【東吉野】${eventTitle}に申込みがありました`,
      text: `${eventTitle}に申込みがありました。\n\nお名前：${name}\nメール：${email}\n${phone}\n${session}\n${party}\n${note}\n`,
    });
  }

  return NextResponse.json({ emailed });
}
