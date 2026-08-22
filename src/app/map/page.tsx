import type { Metadata } from "next";
import { VillageMap } from "@/components/map/village-map";
import { loadPublicArtists } from "@/lib/content/public-artists";
import { loadPublicSpots } from "@/lib/content/public-spots";

export const metadata: Metadata = {
  title: "地図",
};

type Props = {
  searchParams: Promise<{ focus?: string }>;
};

export default async function MapPage({ searchParams }: Props) {
  const { focus } = await searchParams;
  const [artists, spots] = await Promise.all([loadPublicArtists(), loadPublicSpots()]);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">MAP</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">村内マップ</h1>
      <div className="mt-10">
        <VillageMap focus={focus} artists={artists} spots={spots} />
      </div>
    </div>
  );
}
