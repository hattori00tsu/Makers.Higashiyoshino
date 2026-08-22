import { NextResponse } from "next/server";
import { sendResendMail } from "@/lib/mail/resend";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";

type Body = {
  name?: string;
};

export async function POST(request: Request) {
  const name = ((await request.json()) as Body).name?.trim();
  if (!name) {
    return NextResponse.json({ emailed: false }, { status: 400 });
  }

  const flags = await loadMailFlagsServer();
  if (!flags.mailAdminPending || !flags.notifyEmail) {
    return NextResponse.json({ emailed: false });
  }

  const origin = new URL(request.url).origin;
  const emailed = await sendResendMail({
    to: flags.notifyEmail,
    subject: `【東吉野】作家の申請が届きました（${name}）`,
    text: `${name} さんから作家登録の申請が届きました。\n${origin}/admin\n`,
  });

  return NextResponse.json({ emailed });
}
