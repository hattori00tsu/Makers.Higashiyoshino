import { Suspense } from "react";
import { ArtistGrid } from "@/components/home/artists";
import { EventHighlights } from "@/components/home/events";
import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { VisitCta } from "@/components/home/visit";

export const revalidate = 120;

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <Suspense fallback={<section className="min-h-[320px] border-y border-line bg-kami/60" />}>
        <EventHighlights />
      </Suspense>
      <Suspense fallback={<section className="mx-auto min-h-[320px] max-w-6xl" />}>
        <ArtistGrid />
      </Suspense>
      <VisitCta />
    </>
  );
}
