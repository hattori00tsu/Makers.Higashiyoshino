"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { ArtistPhoto } from "@/components/media/artist-photo";
import type { Artist } from "@/data/site";
import { shuffleItems } from "@/lib/content/home-display";

export function ArtistGridView({
  artists,
  shuffleOnLoad,
}: {
  artists: Artist[];
  shuffleOnLoad?: boolean;
}) {
  const [items, setItems] = useState(artists);

  useEffect(() => {
    setItems(shuffleOnLoad ? shuffleItems(artists) : artists);
  }, [artists, shuffleOnLoad]);

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionHeading
        index="03"
        eyebrow="ARTISTS"
        title="むらの作家"
        action={
          items.length > 0 || artists.length > 0 ? (
            <Link
              href="/artists"
              className="hidden text-[13px] tracking-[0.16em] text-sugi md:inline hover:opacity-70"
            >
              全員を見る
            </Link>
          ) : null
        }
      />

      {artists.length === 0 ? (
        <p className="mt-10 max-w-xl text-sm leading-7 text-sumi-soft md:mt-12">
          いま公開中の作家はいません。
          <Link href="/artists" className="ml-2 underline decoration-line underline-offset-4">
            一覧を見る
          </Link>
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
          {items.map((artist) => (
            <li key={artist.slug}>
              <Link href={`/artists/${artist.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden">
                  <ArtistPhoto
                    src={artist.image}
                    alt={artist.name}
                    className="object-cover transition-opacity duration-500 group-hover:opacity-80"
                  />
                </div>
                <p className="mt-3 text-[11px] tracking-[0.16em] text-tsuchi">{artist.genre}</p>
                <h3 className="mt-1 font-serif text-lg tracking-wide">{artist.name}</h3>
                <p className="mt-1 text-sm text-sumi-soft">{artist.area}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {artists.length > 0 ? (
        <div className="mt-10 md:hidden">
          <Link href="/artists" className="text-[13px] tracking-[0.16em] text-sugi">
            全員を見る
          </Link>
        </div>
      ) : null}
    </section>
  );
}
