import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ArtistPhoto } from "@/components/media/artist-photo";
import { shuffleItems } from "@/lib/content/home-display";
import { loadPublicArtists } from "@/lib/content/public-artists";

export const metadata: Metadata = {
  title: "作家",
};

export default async function ArtistsPage() {
  await connection();
  const artists = shuffleItems(await loadPublicArtists());

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARTISTS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">作家</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-sumi-soft">
        東吉野村に工房を構えるつくり手たち。
      </p>

      {artists.length === 0 ? (
        <p className="mt-12 max-w-xl text-sm leading-7 text-sumi-soft">
          いま公開中の作家はいません。
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
          {artists.map((artist) => (
            <li key={artist.slug}>
              <Link href={`/artists/${artist.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden bg-kami">
                  <ArtistPhoto
                    src={artist.image}
                    alt={artist.name}
                    className="object-cover transition-opacity duration-500 group-hover:opacity-80"
                  />
                </div>
                <p className="mt-3 text-[11px] tracking-[0.16em] text-tsuchi">{artist.genre}</p>
                <h2 className="mt-1 font-serif text-lg tracking-wide md:text-xl">{artist.name}</h2>
                <p className="mt-1 text-sm text-sumi-soft">{artist.area}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
