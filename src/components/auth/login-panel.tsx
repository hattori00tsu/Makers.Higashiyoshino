"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { ensureLocalSeed } from "@/lib/account/local";
import { Field, PrimaryButton, TextInput } from "@/components/account/fields";
import { useSession } from "@/lib/account/use-session";

type Props = {
  nextPath: string;
  intent: "visitor" | "artist" | "admin";
  denied?: boolean;
};

function authMessage(message: string) {
  if (/rate limit/i.test(message) || /too many/i.test(message)) {
    return "少し待ってから、もう一度送ってください。";
  }
  if (/signups not allowed/i.test(message)) {
    return "いまは新規のメール登録が閉じられています。";
  }
  return message;
}

export function LoginPanel({ nextPath, intent, denied = false }: Props) {
  const router = useRouter();
  const { user, loading } = useSession();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseConfigured();
  const admin = intent === "admin";

  useEffect(() => {
    if (loading || !user) return;
    if (admin) {
      if (user.role === "admin") {
        router.replace(nextPath.startsWith("/admin") && nextPath !== "/admin/login" ? nextPath : "/admin");
      }
      return;
    }
    if (intent === "artist") {
      if (user.artistStatus === "none") {
        router.replace("/register");
        return;
      }
      router.replace(nextPath.startsWith("/mypage") ? nextPath : "/mypage");
      return;
    }
    router.replace(nextPath.startsWith("/admin") || nextPath.startsWith("/register") ? "/mypage" : nextPath);
  }, [admin, intent, loading, nextPath, router, user]);

  async function google() {
    setError("");
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Supabase の環境変数が未設定です。");
      return;
    }
    try {
      const settings = await fetch(`${supabaseUrl()}/auth/v1/settings`, {
        headers: { apikey: supabaseAnonKey(), Authorization: `Bearer ${supabaseAnonKey()}` },
      });
      const payload = (await settings.json()) as { external?: { google?: boolean } };
      if (!payload.external?.google) {
        setError(
          "Supabase の Authentication → Providers → Google がまだオフです。スイッチをオンにし、Client ID と Secret を入れて保存してください。Google Cloud にキーを入れただけでは有効になりません。",
        );
        return;
      }
    } catch {
      /* continue and let OAuth report the error */
    }
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (authError) setError(authMessage(authError.message));
  }

  async function preview(id: string, dest: string) {
    setError("");
    ensureLocalSeed();
    const response = await fetch("/api/auth/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setError("プレビューに入れませんでした。");
      return;
    }
    router.push(dest);
    router.refresh();
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError("Supabase の環境変数が未設定です。");
      return;
    }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    setBusy(false);
    if (authError) {
      setError(authMessage(authError.message));
      return;
    }
    setNotice("ログイン用のリンクを送りました。メールのリンクを開くと入れます。パスワードはありません。");
  }

  const blocked = denied || Boolean(user && admin && user.role !== "admin");

  if (!configured) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-7 text-sumi-soft">
          {admin
            ? "本番では Google、またはメールに届くリンクで入ります。いまは Supabase 未接続のため、このブラウザだけで運営画面を確認できます。"
            : "本番では Google、またはメールに届くリンクで入ります。いまは Supabase 未接続のため、このブラウザだけで画面を確認できます。"}
        </p>
        {admin ? (
          <PrimaryButton type="button" onClick={() => preview("preview-admin", "/admin")}>
            運営として見る
          </PrimaryButton>
        ) : intent === "artist" ? (
          <>
            <PrimaryButton type="button" onClick={() => preview("preview-visitor", "/register")}>
              つくり手として登録してみる
            </PrimaryButton>
            <div>
              <button
                type="button"
                className="text-[13px] tracking-[0.14em] text-sugi underline decoration-line underline-offset-4"
                onClick={() => preview("preview-artist", "/mypage")}
              >
                登録済みの作家として見る
              </button>
            </div>
          </>
        ) : (
          <PrimaryButton type="button" onClick={() => preview("preview-visitor", nextPath || "/mypage")}>
            来訪者として見る
          </PrimaryButton>
        )}
        {blocked ? (
          <p className="text-sm leading-7 text-sumi-soft">このアカウントには運営権限がありません。</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {blocked ? (
        <p className="text-sm leading-7 text-sumi-soft">
          このアカウントには運営権限がありません。作家として入る場合は
          <Link href="/register" className="mx-1 underline decoration-line underline-offset-4">
            つくり手の入口
          </Link>
          を使ってください。
          {user ? (
            <>
              {" "}
              <button
                type="button"
                className="underline decoration-line underline-offset-4"
                onClick={async () => {
                  await fetch("/api/auth/signout", { method: "POST" });
                  window.location.assign("/admin/login");
                }}
              >
                ログアウト
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <button
        type="button"
        onClick={google}
        className="flex w-full items-center justify-center gap-3 border border-sumi bg-kami px-5 py-3 text-[13px] tracking-[0.16em]"
      >
        <GoogleMark />
        Google でログイン
      </button>

      <p className="text-center text-[11px] tracking-[0.18em] text-sumi-soft">またはメール</p>

      <form className="space-y-5" onSubmit={onEmail}>
        <Field label="メール">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <PrimaryButton type="submit" disabled={busy}>
          ログイン用のリンクを送る
        </PrimaryButton>
      </form>

      {notice ? <p className="text-sm leading-7 text-sumi-soft">{notice}</p> : null}
      {error ? <p className="text-sm text-sumi-soft">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.5 7.3l6.2 5.2C37.9 38.3 44 32 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
