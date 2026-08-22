import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/account/server";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { sendResendMail } from "@/lib/mail/resend";
import { artistMailVars, renderMail } from "@/lib/mail/templates";

type Body = {
  name?: string;
  eventTitle?: string;
  eventSlug?: string;
};

export async function POST(request: Request) {
  const user = await getServerSession();
  if (!user || user.artistStatus === "none") {
    return NextResponse.json({ emailed: false }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const name = body.name?.trim() || user.name;
  const eventTitle = body.eventTitle?.trim();
  if (!name || !eventTitle) {
    return NextResponse.json({ emailed: false }, { status: 400 });
  }

  const flags = await loadMailFlagsServer();
  if (!flags.mailAdminPending || !flags.notifyEmail) {
    return NextResponse.json({ emailed: false });
  }

  const emailed = await sendResendMail({
    to: flags.notifyEmail,
    ...renderMail(
      flags.copy,
      "eventPending",
      artistMailVars(name, new URL(request.url).origin, {
        eventTitle,
        eventSlug: body.eventSlug?.trim(),
      }),
    ),
  });

  return NextResponse.json({ emailed });
}
