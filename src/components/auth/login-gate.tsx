"use client";

import { useState } from "react";
import { LoginPanel } from "@/components/auth/login-panel";
import { useMessages } from "@/lib/i18n/provider";

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
  const t = useMessages();

  if (!intent) {
    return (
      <div className="mt-10 space-y-3">
        <Choice
          label={t.login.visitor}
          note={t.login.visitorNote}
          onClick={() => setIntent("visitor")}
        />
        <Choice
          label={t.login.artist}
          note={t.login.artistNote}
          onClick={() => setIntent("artist")}
        />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="mb-8 text-sm leading-7 text-sumi-soft">
        {intent === "artist" ? t.login.asArtist : t.login.asVisitor}
      </p>
      <LoginPanel intent={intent} nextPath={nextPathFor(intent, next)} />
      <p className="mt-10">
        <button
          type="button"
          className="text-[13px] tracking-[0.14em] text-sumi-soft underline decoration-line underline-offset-4 hover:text-sugi"
          onClick={() => setIntent(null)}
        >
          {t.login.rechoose}
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
