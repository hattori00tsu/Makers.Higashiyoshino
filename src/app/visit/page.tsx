"use client";

import { useSession } from "@/lib/account/use-session";
import { LoginPanel } from "@/components/auth/login-panel";
import { PrimaryButton } from "@/components/account/fields";
import { VisitorReservations } from "@/components/account/visitor-reservations";
import { visitPath } from "@/lib/account/paths";
import { useMessages } from "@/lib/i18n/provider";

export default function VisitPage() {
  const { user, loading, signOut } = useSession();
  const t = useMessages();

  async function onSignOut() {
    await signOut();
    window.location.assign("/");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">{t.common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-24 pb-20 md:pt-28 md:pb-28">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">VISIT</p>
        <h1 className="mt-3 font-serif text-3xl tracking-wide">{t.visit.title}</h1>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          {t.visit.lead}
        </p>
        <div className="mt-10">
          <LoginPanel intent="visitor" nextPath={visitPath} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">VISIT</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">{t.visit.reservations}</h1>
      <p className="mt-2 text-sm text-sumi-soft">{user.email || t.visit.noEmail}</p>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        {t.visit.reservedLead}
        {user.role === "admin" ? t.visit.adminNote : ""}
      </p>
      <VisitorReservations user={user} />
      <div className="mt-14">
        <PrimaryButton type="button" onClick={onSignOut}>
          {t.visit.logout}
        </PrimaryButton>
      </div>
    </div>
  );
}
