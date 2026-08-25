"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArtistPhoto } from "@/components/media/artist-photo";
import type { ArtistPastEvent } from "@/lib/calendar";
import { shuffleItems } from "@/lib/content/home-display";
import type { Artist } from "@/data/site";

type Props = {
  artists: Artist[];
  history?: Record<string, ArtistPastEvent[]>;
};

export function ArtistsBrowser({ artists, history = {} }: Props) {
  const [items, setItems] = useState(artists);

  useEffect(() => {
    setItems(shuffleItems(artists));
  }, [artists]);

  if (artists.length === 0) {
    return (
      <p className="mt-12 max-w-xl text-sm leading-7 text-sumi-soft">
        いま公開中のつくり手はいません。
      </p>
    );
  }

  return (
    <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
      {items.map((artist) => {
        const past = history[artist.slug] ?? [];
        return (
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
            {past.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] tracking-[0.14em] text-tsuchi">これまでの開催</p>
                <ul className="mt-1.5 space-y-2">
                  {past.map((event) => (
                    <li key={event.slug}>
                      <Link href={`/events/${event.slug}`} className="group/event block">
                        {event.meta ? (
                          <p className="text-[11px] leading-5 tracking-[0.04em] text-sumi-soft">{event.meta}</p>
                        ) : null}
                        <p className="font-serif text-sm tracking-wide group-hover/event:text-sugi">{event.title}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
