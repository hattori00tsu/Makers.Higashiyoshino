import type { Metadata } from "next";
import Link from "next/link";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata: Metadata = {
  title: "運営として入る",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; denied?: string }>;
}) {
  const { next, denied } = await searchParams;
  const nextPath = next && next.startsWith("/admin") ? next : "/admin";
  return (
    <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">運営として入る</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        来訪者・作家のログインとは別の入口です。Google、またはメールに届くリンクで入れます。運営権限のないアカウントでは管理画面に入れません。
      </p>
      <div className="mt-10">
        <LoginPanel intent="admin" nextPath={nextPath} denied={denied === "1"} />
      </div>
      <p className="mt-10 text-sm text-sumi-soft">
        つくり手の入口は
        <Link href="/register" className="mx-1 underline decoration-line underline-offset-4">
          こちら
        </Link>
        です。
      </p>
    </div>
  );
}
