import { NextResponse } from "next/server";
import { loadMailFlagsServer } from "@/lib/mail/flags-server";
import { isResendConfigured, sendResendMail } from "@/lib/mail/resend";
import { renderMail, signInMailVars } from "@/lib/mail/templates";
import { createServiceSupabase } from "@/lib/supabase/admin";

type Body = {
  email?: string;
  nextPath?: string;
};

function safeNext(path?: string) {
  return path?.startsWith("/") ? path : "/visit";
}

function signInHtml(text: string, signInUrl: string) {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const inner = text
    .split(signInUrl)
    .map(escape)
    .join(`<a href="${escape(signInUrl)}">ログインする</a>`);
  return `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.8; color: #222; white-space: pre-wrap;">${inner}</div>`;
}

export async function POST(request: Request) {
  const admin = createServiceSupabase();
  if (!admin || !isResendConfigured()) {
    return NextResponse.json({ fallback: true });
  }

  const body = (await request.json()) as Body;
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "メールアドレスを確認してください。" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const next = safeNext(body.nextPath);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const tokenHash = data.properties.hashed_token;
  const type = data.properties.verification_type || "magiclink";
  if (!tokenHash) {
    return NextResponse.json({ error: "リンクを作れませんでした。" }, { status: 500 });
  }

  const signInUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;
  const flags = await loadMailFlagsServer();
  const copy = renderMail(flags.copy, "signInLink", signInMailVars({ email, signInUrl }));
  const emailed = await sendResendMail({
    to: email,
    ...copy,
    html: signInHtml(copy.text, signInUrl),
  });
  if (!emailed) {
    return NextResponse.json({ error: "mail" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
