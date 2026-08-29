import type { Metadata } from "next";
import { VillageMap } from "@/components/map/village-map";
import { getMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.map.title };
}

export default async function MapPage() {
  const t = await getMessages();
  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MAP</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{t.map.title}</h1>
      <div className="mt-10">
        <VillageMap />
      </div>
      <section className="mt-10">
        <p>
          {t.map.note}{" "}
          <a href="https://higashiyoshino.com/index.html" target="_blank" rel="noopener noreferrer" className="text-sugi">
            {t.map.association}
          </a>
        </p>
      </section>
    </div>
  );
}
