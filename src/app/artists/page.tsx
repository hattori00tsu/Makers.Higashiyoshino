import type { Metadata } from "next";
import { ArtistsBrowser } from "@/components/artists/artists-browser";
import { loadPublicArtists } from "@/lib/content/public-artists";

export const metadata: Metadata = {
  title: "作家",
};

export default async function ArtistsPage() {
  const artists = await loadPublicArtists();

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARTISTS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">作家</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-sumi-soft">
        東吉野村に工房を構えるつくり手たち。
      </p>
      <ArtistsBrowser artists={artists} />
    </div>
  );
}
