import { ArtistGrid } from "@/components/home/artists";
import { EventHighlights } from "@/components/home/events";
import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { VisitCta } from "@/components/home/visit";

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <EventHighlights />
      <ArtistGrid />
      <VisitCta />
    </>
  );
}
