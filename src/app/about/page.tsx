import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "このサイトについて",
  description: site.description,
};

const pages = [
  {
    href: "/events",
    label: "催し",
    note: "開催中と開催予定。定員のある企画は、ログインして申し込めます。",
  },
  {
    href: "/archive",
    label: "アーカイブ",
    note: "終了した総合開催と会場。個別の催しは、それぞれのページから辿れます。",
  },
  {
    href: "/artists",
    label: "作家",
    note: "工房の場所と、いまの仕事。見学の可否は、各ページに書いてあります。",
  },
  {
    href: "/map",
    label: "地図",
    note: "工房、催しの会場、食事や宿。谷は道が細いので、ピンを頼りにしてください。",
  },
  {
    href: "/news",
    label: "お知らせ",
    note: "運営からの短い知らせです。",
  },
  {
    href: "/guide",
    label: "案内",
    note: "行き方と、滞在の目安。催しの日は、ダイヤと駐車場を先にご確認ください。",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ABOUT</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">このサイトについて</h1>

      <div className="mt-12 grid items-start gap-12 md:mt-16 md:grid-cols-12 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden md:sticky md:top-28 md:col-span-5">
          <Image
            src="/images/visit.jpg"
            alt="村の道"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="md:col-span-7">
          <section>
            <h2 className="font-serif text-2xl tracking-wide md:text-[1.65rem]">コンセプト</h2>
            <p className="mt-6 font-serif text-xl leading-relaxed tracking-wide">
              育てる場所。育てられる場所。
            </p>
            <div className="mt-6 max-w-xl space-y-5 text-[15px] leading-8 text-sumi-soft">
              <p>
                東吉野の山の中で、移住してきたつくり手たちが、それぞれの仕事を深めている。器はお茶を受け、お茶は器を育て、割れた器のかけらはジュエリーになる。
              </p>
              <p>
                作るほどに深まり、使うほどに変わり、出会うほどに広がっていく。ここは、そういう場所。
              </p>
            </div>
          </section>

          <section className="mt-14 border-t border-line pt-12">
            <h2 className="font-serif text-2xl tracking-wide md:text-[1.65rem]">ミッション</h2>
            <div className="mt-6 max-w-xl space-y-5 text-[15px] leading-8 text-sumi-soft">
              <p>
                東吉野に根を張り、つくることを生業にしようとしている人たちがいる。Makers.Higashiyoshino
                は、その発表の場であり、協働の器。それぞれが目標を掲げ、挑戦し、互いの仕事が響き合う。
              </p>
              <p>
                ここにあるものは、見て、触れて、飲んで、食べて──五感を通してはじめて伝わる。来てくれた人との出会いも含めて、ここで起きることのすべてが、次へとつながっていく。
              </p>
            </div>
          </section>

          <section className="mt-14 border-t border-line pt-12">
            <h2 className="font-serif text-2xl tracking-wide md:text-[1.65rem]">この場のなりたち</h2>
            <div className="mt-6 max-w-xl space-y-5 text-[15px] leading-8 text-sumi-soft">
              <p>
                東吉野村には、およそ十年前から、工芸作家、写真家、物書きといったつくり手が少しずつ移り住んできました。Makers.Higashiyoshino
                は、そのなかでご縁のつながった顔ぶれに Okuyama House
                が声をかけ、場所をひらくかたちで始まりました。
              </p>
            </div>
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
              またはメールでのログイン（登録）が必要です。予約の確認とキャンセルは、来訪者ページから行えます。工房見学の可否は作家ごとのページに、行き方は案内にまとめています。
            </p>
            <p>道が細い区間があります。地図を先に見て、車は案内に従って停めてください。</p>
          </div>
          <p className="mt-6">
            <Link
              href="/login"
              className="text-[13px] tracking-[0.16em] text-sugi underline decoration-line underline-offset-4"
            >
              来訪者の入口
            </Link>
          </p>
        </section>
      </div>

      <section className="mt-12 border-t border-line pt-12 md:mt-16">
        <h2 className="font-serif text-xl tracking-wide">運営</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-sumi-soft">
          {site.name}。{site.prefecture}
          を拠点に、催しとつくり手の案内を公開しています。掲載内容は変更することがあります。最新は各ページをご確認ください。個人情報の取り扱いは
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
