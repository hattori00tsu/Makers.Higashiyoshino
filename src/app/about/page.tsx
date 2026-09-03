import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  defaultAboutConcept,
  defaultAboutImage,
  resolveHomeImage,
  splitCopyLines,
} from "@/lib/content/home-display";
import { loadPublicHomeDisplay } from "@/lib/content/public-home-display";
import { localizedAbout } from "@/lib/i18n/content";
import { getLocale, getMessages } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return {
    title: t.about.title,
    description: t.site.description,
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getMessages();
  const display = await loadPublicHomeDisplay();
  const concept = localizedAbout(display.about ?? defaultAboutConcept(), locale);
  const image = resolveHomeImage(concept.image, defaultAboutImage);
  const body = splitCopyLines(concept.body);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ABOUT</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{t.about.title}</h1>

      <div className="mt-12 grid items-start gap-12 md:mt-16 md:grid-cols-12 md:gap-16">
        <div className="md:sticky md:top-28 md:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={image}
              alt={concept.title || concept.heading || ""}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="md:col-span-7">
          <section>
            {concept.heading ? (
              <h2 className="font-serif text-2xl tracking-wide md:text-[1.65rem]">{concept.heading}</h2>
            ) : null}
            {concept.title ? (
              <p className={`${concept.heading ? "mt-6" : ""} font-serif text-xl leading-relaxed tracking-wide`}>
                {concept.title}
              </p>
            ) : null}
            {body.length > 0 ? (
              <div className="mt-6 max-w-xl space-y-5 text-[15px] leading-8 text-sumi-soft">
                {body.map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <section className="mt-20 border-t border-line pt-12 md:mt-28 md:pt-16">
        <h2 className="font-serif text-xl tracking-wide">{t.about.canDo}</h2>
        <ul className="mt-8 grid border-t border-line md:grid-cols-2 md:gap-x-16">
          {t.about.pages.map((item) => (
            <li key={item.href} className="border-b border-line">
              <Link href={item.href} className="group block py-6">
                <p className="font-serif text-lg tracking-wide group-hover:text-sugi">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-sumi-soft">{item.note}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-12 border-t border-line pt-12 md:mt-10 md:grid-cols-2 md:gap-16 md:pt-16">
        <section>
          <h2 className="font-serif text-xl tracking-wide">{t.about.forVisitors}</h2>
          <div className="mt-5 max-w-md space-y-4 text-sm leading-7 text-sumi-soft">
            <p>{t.about.visitorBody1}</p>
            <p>{t.about.visitorBody2}</p>
          </div>
          <p className="mt-6">
            <Link
              href="/visit"
              className="text-[13px] tracking-[0.16em] text-sugi underline decoration-line underline-offset-4"
            >
              {t.about.visitorLink}
            </Link>
          </p>
        </section>
      </div>

      <section className="mt-12 border-t border-line pt-12 md:mt-16">
        <h2 className="font-serif text-xl tracking-wide">{t.about.ops}</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-sumi-soft">
          {t.about.opsBodyBefore}
          <Link href="/privacy" className="mx-1 underline decoration-line underline-offset-4">
            {t.footer.privacy}
          </Link>
          {t.about.opsBodyAfter}
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-12 md:mt-16">
        <h2 className="font-serif text-xl tracking-wide">{t.about.contact}</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-sumi-soft">
          info@makers-higashiyoshino.com
        </p>
      </section>
    </div>
  );
}
