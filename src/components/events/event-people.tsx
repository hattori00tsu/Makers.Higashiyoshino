"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { linkableArtistsLive } from "@/lib/content/live";

type Person = { slug: string; name: string; genre: string };

export function EventPeople({ slugs }: { slugs: string[] }) {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    linkableArtistsLive().then((artists) => {
      const map = new Map(artists.map((artist) => [artist.slug, artist]));
      setPeople(
        slugs
          .map((slug) => map.get(slug) ?? null)
          .filter((item): item is Person => Boolean(item)),
      );
    });
  }, [slugs]);

  if (people.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl tracking-wide">参加する作家</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {people.map((artist) => (
          <li key={artist.slug}>
            <Link
              href={`/artists/${artist.slug}`}
              className="flex items-center justify-between py-4 text-sm hover:text-sugi"
            >
              <span className="font-serif text-base tracking-wide">{artist.name}</span>
              <span className="tracking-[0.14em] text-sumi-soft">{artist.genre}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
