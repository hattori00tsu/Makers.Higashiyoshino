import { NextResponse } from "next/server";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { sendResendMail } from "@/lib/mail/resend";
import { artistMailVars, renderMail } from "@/lib/mail/templates";

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

  const emailed = await sendResendMail({
    to: flags.notifyEmail,
    ...renderMail(flags.copy, "artistPending", artistMailVars(name, new URL(request.url).origin)),
  });

  return NextResponse.json({ emailed });
}
