"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { spots as seedSpots, type SpotItem } from "@/data/site";
import { loadSpotsLive } from "@/lib/content/live";

export function SpotList() {
  const [items, setItems] = useState<SpotItem[]>(seedSpots);
  useEffect(() => {
    loadSpotsLive().then(setItems);
  }, []);

  if (items.length === 0) {
    return <p className="mt-5 text-sm leading-7 text-sumi-soft">いま案内できる周辺スポットはありません。</p>;
  }

  return (
    <ul className="mt-5 divide-y divide-line border-y border-line">
      {items.map((spot) => (
        <li key={spot.name} className="grid grid-cols-[4.5rem_1fr] gap-4 py-5 text-sm">
          <p className="tracking-[0.12em] text-tsuchi">{spot.category}</p>
          <div>
            <p className="font-serif text-base tracking-wide text-sumi">{spot.name}</p>
            <p className="mt-1 leading-6 text-sumi-soft">{spot.note}</p>
            <Link
              href={`/map?focus=spot:${spot.name}`}
              className="mt-2 inline-block text-[12px] tracking-[0.12em] text-sugi"
            >
              地図で見る
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
