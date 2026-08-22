import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/account/server";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { sendResendMail } from "@/lib/mail/resend";
import { artistMailVars, renderMail } from "@/lib/mail/templates";
import { createServerSupabase } from "@/lib/supabase/server";

type Body = {
  name?: string;
  artistId?: string;
  status?: "approved" | "rejected";
};

export async function POST(request: Request) {
  const user = await getServerSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ emailed: false }, { status: 401 });
  }

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

  const emailed = await sendResendMail({
    to: String(email),
    ...renderMail(
      flags.copy,
      status === "approved" ? "artistApproved" : "artistRejected",
      artistMailVars(name, new URL(request.url).origin),
    ),
  });

  return NextResponse.json({ emailed });
}
