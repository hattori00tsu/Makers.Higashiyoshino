import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata: Metadata = {
  title: "ログイン",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next === "/register" || next?.startsWith("/register?")) {
    redirect("/register");
  }
  const nextPath =
    next && next.startsWith("/") && !next.startsWith("/admin") && !next.startsWith("/register")
      ? next
      : "/mypage";
  return (
    <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">SIGN IN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">ログイン</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        催しの申込みと予約の確認のための入口です。Google、またはメールに届くリンクで入れます。パスワードはありません。
      </p>
      <div className="mt-10">
        <LoginPanel intent="visitor" nextPath={nextPath} />
      </div>
    </div>
  );
}
