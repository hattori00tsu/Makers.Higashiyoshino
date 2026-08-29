import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/data/site";
import { getMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return {
    title: t.privacy.title,
    description: t.privacy.description(site.name),
  };
}

export default async function PrivacyPage() {
  const t = await getMessages();
  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">PRIVACY</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">
        {t.privacy.title}
      </h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        {t.privacy.intro(site.name)}
      </p>

      <div className="mt-14 space-y-14 text-sm leading-7 text-sumi-soft">
        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.collect}</h2>
          <p className="mt-4">{t.privacy.collectLead}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {t.privacy.collectItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4">{t.privacy.collectNote}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.purpose}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {t.privacy.purposeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4">{t.privacy.purposeNote}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.publish}</h2>
          <p className="mt-4">{t.privacy.publish1}</p>
          <p className="mt-3">{t.privacy.publish2}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.cookie}</h2>
          <p className="mt-4">{t.privacy.cookieBody}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.keep}</h2>
          <p className="mt-4">{t.privacy.keep1}</p>
          <p className="mt-3">{t.privacy.keep2}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.revise}</h2>
          <p className="mt-4">{t.privacy.reviseBody}</p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">{t.privacy.ops}</h2>
          <p className="mt-4">{t.privacy.opsBody}</p>
          <p className="mt-6 text-[13px] tracking-wide">{t.privacy.enacted}</p>
        </section>
      </div>
    </div>
  );
}
