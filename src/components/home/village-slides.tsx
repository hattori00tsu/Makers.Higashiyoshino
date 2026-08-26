"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  defaultVillageImage,
  resolveHomeImage,
  villageSlideIntervalMs,
  type HomeVillage,
} from "@/lib/content/home-display";

type Props = {
  villages: HomeVillage[];
};

function VillageSlide({ village, priority }: { village: HomeVillage; priority?: boolean }) {
  const src = resolveHomeImage(village.image, defaultVillageImage);
  const paragraphs = village.summary
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="grid w-full min-w-full shrink-0 basis-full items-center gap-12 md:grid-cols-12 md:gap-16">
      <div className="relative aspect-[4/5] overflow-hidden md:col-span-5">
        <Image
          src={src}
          alt={village.title || "山村の家並み"}
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="pointer-events-none object-cover"
          priority={priority}
          draggable={false}
        />
      </div>
      <div className="md:col-span-7 md:py-6">
        {village.title ? (
          <h2 className="font-serif text-[1.65rem] leading-snug tracking-wide md:text-3xl">
            {village.title}
          </h2>
        ) : null}
        {village.schedule ? (
          <p className={`${village.title ? "mt-4" : ""} text-[13px] tracking-[0.14em] text-tsuchi`}>
            {village.schedule}
          </p>
        ) : null}
        {paragraphs.length > 0 ? (
          <div className="mt-8 space-y-6 text-[15px] leading-8 text-sumi-soft md:max-w-xl">
            {paragraphs.map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function VillageSlides({ villages }: Props) {
  const items = villages.length > 0 ? villages : [];
  const multiple = items.length > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragXRef = useRef(0);
  const axis = useRef<"undecided" | "x" | "y">("undecided");
  const viewportRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => {
      if (!multiple) return;
      setIndex((current) => (current + delta + items.length) % items.length);
      setDragX(0);
    },
    [items.length, multiple],
  );

  useEffect(() => {
    if (!multiple || paused || dragging) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => go(1), villageSlideIntervalMs);
    return () => window.clearInterval(id);
  }, [dragging, go, index, multiple, paused]);

  useEffect(() => {
    if (index < items.length) return;
    setIndex(0);
  }, [index, items.length]);

  if (items.length === 0) return null;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!multiple || event.button !== 0) return;
    startX.current = event.clientX;
    startY.current = event.clientY;
    dragXRef.current = 0;
    axis.current = "undecided";
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging || !multiple) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;
    if (axis.current === "undecided") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (axis.current !== "x") return;
    event.preventDefault();
    dragXRef.current = dx;
    setDragX(dx);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    const dx = dragXRef.current;
    const width = viewportRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(80, width * 0.18);
    if (axis.current === "x") {
      if (dx <= -threshold) go(1);
      else if (dx >= threshold) go(-1);
      else setDragX(0);
    } else {
      setDragX(0);
    }
    dragXRef.current = 0;
    axis.current = "undecided";
  }

  return (
    <section
      className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28"
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label="紹介"
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={(event) => {
        if (!multiple) return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(-1);
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={viewportRef}
        className={`overflow-hidden ${multiple ? "touch-pan-y cursor-grab select-none active:cursor-grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`flex gap-[var(--village-slide-gap)] [--village-slide-gap:1.25rem] motion-reduce:transition-none md:[--village-slide-gap:2rem] ${dragging ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
          style={{ transform: `translateX(calc(-${index} * (100% + var(--village-slide-gap)) + ${dragX}px))` }}
        >
          {items.map((village, slideIndex) => (
            <VillageSlide
              key={village.id ?? `${village.image}-${slideIndex}`}
              village={village}
              priority={slideIndex === 0}
            />
          ))}
        </div>
      </div>

      {multiple ? (
        <div className="mt-8 flex items-center justify-center gap-5 md:mt-10">
          <button
            type="button"
            className="px-2 py-1 text-[18px] leading-none text-sumi-soft"
            aria-label="前へ"
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <div className="flex items-center gap-2">
            {items.map((village, slideIndex) => (
              <button
                key={village.id ?? slideIndex}
                type="button"
                className={`h-1.5 rounded-full transition-[width,background-color] ${
                  slideIndex === index ? "w-6 bg-sumi" : "w-1.5 bg-line"
                }`}
                aria-label={`${slideIndex + 1}枚目`}
                aria-current={slideIndex === index}
                onClick={() => {
                  setIndex(slideIndex);
                  setDragX(0);
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="px-2 py-1 text-[18px] leading-none text-sumi-soft"
            aria-label="次へ"
            onClick={() => go(1)}
          >
            ›
          </button>
        </div>
      ) : null}
    </section>
  );
}
