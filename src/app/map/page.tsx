import type { Metadata } from "next";
import { VillageMap } from "@/components/map/village-map";

export const metadata: Metadata = {
  title: "地図",
};

export default function MapPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MAP</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">村内マップ</h1>
      <div className="mt-10">
        <VillageMap />
      </div>
      <section className="mt-10">
        <p>村内の飲食店・宿泊施設などについては、東吉野村観光協会の情報をご覧ください。
        <a href="https://higashiyoshino.com/index.html" target="_blank" rel="noopener noreferrer" className="text-sugi">東吉野村観光協会</a>
        </p>
      </section>
    </div>
  );
}
