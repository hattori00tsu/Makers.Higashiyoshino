import { NextResponse } from "next/server";
import { artistRecipientsForEvent } from "@/lib/mail/artists";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { mailCopyFor } from "@/lib/mail/settings";
import { sendResendMail } from "@/lib/mail/resend";
import { renderMail, reservationMailVars } from "@/lib/mail/templates";
import { localeFromCookieHeader, parseLocale, type Locale } from "@/lib/i18n/locale";

type Body = {
  eventTitle?: string;
  eventSlug?: string;
  name?: string;
  email?: string;
  phone?: string;
  partySize?: number;
  note?: string;
  sessionLabel?: string;
  locale?: Locale;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const email = body.email?.trim();
  const name = body.name?.trim();
  const eventTitle = body.eventTitle?.trim();
  if (!email || !name || !eventTitle) {
    return NextResponse.json({ emailed: false }, { status: 400 });
  }

  const locale = body.locale ? parseLocale(body.locale) : localeFromCookieHeader(request.headers.get("cookie"));
  const flags = await loadMailFlagsServer();
  const vars = reservationMailVars({
    eventTitle,
    visitorName: name,
    visitorEmail: email,
    phone: body.phone,
    partySize: body.partySize,
    note: body.note,
    sessionLabel: body.sessionLabel,
    origin: new URL(request.url).origin,
    locale,
  });

  let emailed = false;
  if (flags.mailApplications) {
    emailed = await sendResendMail({ to: email, ...renderMail(mailCopyFor(flags, locale), "reservationConfirmed", vars) });
  }

  if (flags.mailArtistApplications) {
    const jaVars = reservationMailVars({
      eventTitle,
      visitorName: name,
      visitorEmail: email,
      phone: body.phone,
      partySize: body.partySize,
      note: body.note,
      sessionLabel: body.sessionLabel,
      origin: new URL(request.url).origin,
    });
    for (const artist of await artistRecipientsForEvent(body.eventSlug)) {
      await sendResendMail({
        to: artist.email,
        ...renderMail(flags.copy, "reservationArtist", {
          ...jaVars,
          artistName: artist.name?.trim() || "つくり手",
        }),
      });
    }
  }

  return NextResponse.json({ emailed });
}
