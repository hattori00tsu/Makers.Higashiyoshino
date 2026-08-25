"use client";

import { useState } from "react";
import { LoginPanel } from "@/components/auth/login-panel";

type Intent = "visitor" | "artist";

type Props = {
  next: string;
  initialIntent?: Intent | null;
};

function nextPathFor(intent: Intent, next: string) {
  if (intent === "artist") {
    return next.startsWith("/mypage") || next.startsWith("/register") ? next : "/register";
  }
  if (
    next.startsWith("/") &&
    !next.startsWith("/admin") &&
    !next.startsWith("/register") &&
    !next.startsWith("/mypage")
  ) {
    return next;
  }
  return "/visit";
}

export function LoginGate({ next, initialIntent = null }: Props) {
  const [intent, setIntent] = useState<Intent | null>(initialIntent);

  if (!intent) {
    return (
      <div className="mt-10 space-y-3">
        <Choice
          label="来訪者"
          note="催しの申込みと、予約の確認・キャンセル"
          onClick={() => setIntent("visitor")}
        />
        <Choice
          label="つくり手"
          note="プロフィール、作品、催しの管理"
          onClick={() => setIntent("artist")}
        />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="mb-8 text-sm leading-7 text-sumi-soft">
        {intent === "artist"
          ? "つくり手として入ります。入ったあと、未登録ならつくり手登録ができます。"
          : "来訪者として入ります。催しの申込みと予約の確認ができます。"}
      </p>
      <LoginPanel intent={intent} nextPath={nextPathFor(intent, next)} />
      <p className="mt-10">
        <button
          type="button"
          className="text-[13px] tracking-[0.14em] text-sumi-soft underline decoration-line underline-offset-4 hover:text-sugi"
          onClick={() => setIntent(null)}
        >
          選び直す
        </button>
      </p>
    </div>
  );
}

function Choice({
  label,
  note,
  onClick,
}: {
  label: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start border border-line bg-kami px-5 py-4 text-left transition-colors hover:border-sumi"
    >
      <span className="font-serif text-lg tracking-wide">{label}</span>
      <span className="mt-1 text-sm leading-7 text-sumi-soft">{note}</span>
    </button>
  );
}
