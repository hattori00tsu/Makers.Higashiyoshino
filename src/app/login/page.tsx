import type { Metadata } from "next";
import { LoginGate } from "@/components/auth/login-gate";

export const metadata: Metadata = {
  title: "ログイン",
};

type Intent = "visitor" | "artist";

function parseIntent(as?: string, next?: string): Intent | null {
  if (as === "visitor" || as === "artist") return as;
  if (next?.startsWith("/register") || next?.startsWith("/mypage")) return "artist";
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("/admin") &&
    next !== "/visit" &&
    next !== "/login"
  ) {
    return "visitor";
  }
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; as?: string }>;
}) {
  const { next, as } = await searchParams;
  const requested =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">SIGN IN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">ログイン</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        来訪者か、つくり手かを選んで入ってください。Google、またはメールに届くリンクで入れます。パスワードはありません。
      </p>
      <LoginGate next={requested} initialIntent={parseIntent(as, requested)} />
    </div>
  );
}
