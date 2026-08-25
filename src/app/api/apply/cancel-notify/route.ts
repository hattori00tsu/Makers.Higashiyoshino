import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/account/server";
import { artistRecipientsForEvent } from "@/lib/mail/artists";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { sendResendMail } from "@/lib/mail/resend";
import { renderMail, reservationMailVars } from "@/lib/mail/templates";

type Body = {
  eventTitle?: string;
  eventSlug?: string;
  name?: string;
  email?: string;
  partySize?: number;
  sessionLabel?: string;
  reason?: string;
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
  const vars = reservationMailVars({
    eventTitle,
    visitorName: name,
    visitorEmail: email,
    partySize: body.partySize,
    sessionLabel: body.sessionLabel,
    reason: body.reason,
    origin: new URL(request.url).origin,
  });

  let emailed = false;
  if (flags.mailApplications) {
    emailed = await sendResendMail({ to: email, ...renderMail(flags.copy, "cancelConfirmed", vars) });
  }

  if (flags.mailArtistApplications) {
    for (const artist of await artistRecipientsForEvent(body.eventSlug)) {
      await sendResendMail({
        to: artist.email,
        ...renderMail(flags.copy, "cancelArtist", {
          ...vars,
          artistName: artist.name?.trim() || "つくり手",
        }),
      });
    }
  }

  return NextResponse.json({ emailed });
}
