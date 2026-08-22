import Link from "next/link";
import type { Metadata } from "next";
import { SpotList } from "@/components/guide/spot-list";

export const metadata: Metadata = {
  title: "案内",
};

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">VISIT</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">案内</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        東吉野村は、鉄道の駅から少し離れています。催しに合わせて、行き方と滞在の目安を先に見ておいてください。工房と会場の位置は
        <Link href="/map" className="mx-1 underline decoration-line underline-offset-4">
          地図
        </Link>
        にまとめています。
      </p>

      <section className="mt-14">
        <h2 className="font-serif text-xl tracking-wide">交通</h2>
        <ol className="mt-5 space-y-5 text-sm leading-7 text-sumi-soft">
          <li>
            <span className="text-sumi">1. 近鉄大阪線「榛原」へ。</span>
            大阪難波から急行でおよそ一時間です。
          </li>
          <li>
            <span className="text-sumi">2. コミュニティバスまたは路線バスで村へ。</span>
            役場方面まで約五十分。本数が少ないため、時刻表の確認を推奨します。
          </li>
          <li>
            <span className="text-sumi">3. 車の場合。</span>
            名阪国道「針」から南下、または吉野方面から高見峠を越えます。谷の道は狭い区間があります。
          </li>
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-xl tracking-wide">周辺</h2>
        <SpotList />
      </section>
    </div>
  );
}
