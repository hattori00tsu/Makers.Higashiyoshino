"use client";

import { useState } from "react";
import { eventGallery, type EventItem } from "@/data/site";

type Props = {
  event: EventItem;
};

export function EventGallery({ event }: Props) {
  const images = eventGallery(event);
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  const src = images[active] ?? images[0];
  const multiple = images.length > 1;

  function go(delta: number) {
    if (!multiple) return;
    setActive((current) => (current + delta + images.length) % images.length);
  }

  return (
    <section className="mt-10">
      <div className="relative aspect-square overflow-hidden bg-kami">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${event.title} ${active + 1}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {multiple ? (
          <>
            <button
              type="button"
              className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer bg-transparent"
              aria-label="前の写真"
              onClick={() => go(-1)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer bg-transparent"
              aria-label="次の写真"
              onClick={() => go(1)}
            />
            <span
              className="pointer-events-none absolute left-3 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-kami/80 text-sumi md:flex"
              aria-hidden
            >
              ‹
            </span>
            <span
              className="pointer-events-none absolute right-3 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-kami/80 text-sumi md:flex"
              aria-hidden
            >
              ›
            </span>
          </>
        ) : null}
      </div>
      {multiple ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`h-1.5 w-1.5 rounded-full ${index === active ? "bg-sumi" : "bg-line"}`}
              aria-label={`${index + 1}枚目`}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
