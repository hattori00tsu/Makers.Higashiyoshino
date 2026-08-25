import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/data/site";
import {
  defaultAboutConcept,
  defaultAboutImage,
  resolveHomeImage,
  splitCopyLines,
} from "@/lib/content/home-display";
import { loadPublicHomeDisplay } from "@/lib/content/public-home-display";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "このサイトについて",
  description: site.description,
};

const pages = [
  {
    href: "/events",
    label: "催し",
    note: "開催中と開催予定。定員のある企画は、ログインして予約ができます。支払いは現地で作家や会場と個別に行ってください",
  },
  {
    href: "/archive",
    label: "アーカイブ",
    note: "終了した総合開催と会場。個別の催しは、それぞれのページから辿れます。",
  },
  {
    href: "/artists",
    label: "つくり手",
    note: "つくり手情報",
  },
  {
    href: "/map",
    label: "地図",
    note: "東吉野村の位置。",
  },
  {
    href: "/news",
    label: "お知らせ",
    note: "運営からの短い知らせです。",
  },
] as const;

export default async function AboutPage() {
  const display = await loadPublicHomeDisplay();
  const concept = display.about ?? defaultAboutConcept();
  const image = resolveHomeImage(concept.image, defaultAboutImage);
  const body = splitCopyLines(concept.body);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ABOUT</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">このサイトについて</h1>

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
        <h2 className="font-serif text-xl tracking-wide">このサイトでできること</h2>
        <ul className="mt-8 grid border-t border-line md:grid-cols-2 md:gap-x-16">
          {pages.map((item) => (
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
          <h2 className="font-serif text-xl tracking-wide">訪ねる人へ</h2>
          <div className="mt-5 max-w-md space-y-4 text-sm leading-7 text-sumi-soft">
            <p>
              閲覧にログインは不要です。催しの申込みには、Google
              またはメールでのログイン（登録）が必要です。予約の確認とキャンセルは、来訪者ページから行えます。工房見学の可否は作家ごとのページに、村の位置は地図にまとめています。
            </p>
            <p>道が細い区間があります。地図を先に見て、車は案内に従って停めてください。</p>
          </div>
          <p className="mt-6">
            <Link
              href="/visit"
              className="text-[13px] tracking-[0.16em] text-sugi underline decoration-line underline-offset-4"
            >
              来訪者
            </Link>
          </p>
        </section>
      </div>

      <section className="mt-12 border-t border-line pt-12 md:mt-16">
        <h2 className="font-serif text-xl tracking-wide">運営</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-sumi-soft">
          掲載内容は変更することがあります。最新は各ページをご確認ください。個人情報の取り扱いは
          <Link href="/privacy" className="mx-1 underline decoration-line underline-offset-4">
            プライバシーポリシー
          </Link>
          にまとめています。
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-12 md:mt-16">
        <h2 className="font-serif text-xl tracking-wide">お問い合わせ</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-sumi-soft">
          info@makers-higashiyoshino.com
        </p>
      </section>
    </div>
  );
}
