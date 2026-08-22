"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArtistPhoto } from "@/components/media/artist-photo";
import { shuffleItems } from "@/lib/content/home-display";
import type { Artist } from "@/data/site";

export function ArtistsBrowser({ artists }: { artists: Artist[] }) {
  const [items, setItems] = useState<Artist[]>([]);

  useEffect(() => {
    setItems(shuffleItems(artists));
  }, [artists]);

  if (artists.length === 0) {
    return (
      <p className="mt-12 max-w-xl text-sm leading-7 text-sumi-soft">
        いま公開中の作家はいません。
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="mt-12 max-w-xl text-sm leading-7 text-sumi-soft">読み込み中です。</p>;
  }

  return (
    <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
      {items.map((artist) => (
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
  );
}
