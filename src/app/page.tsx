import { Suspense } from "react";
import { ArtistGrid } from "@/components/home/artists";
import { EventHighlights } from "@/components/home/events";
import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { VisitCta } from "@/components/home/visit";
import { loadPublicHomeDisplay } from "@/lib/content/public-home-display";
import { homeVillages } from "@/lib/content/home-display";
import { localizedHomeDisplay } from "@/lib/i18n/content";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const display = localizedHomeDisplay(await loadPublicHomeDisplay(), locale);

  return (
    <>
      <Hero hero={display.hero} />
      <Intro villages={homeVillages(display)} />
      <Suspense fallback={<section className="min-h-[320px] border-y border-line bg-kami/60" />}>
        <EventHighlights display={display} />
      </Suspense>
      <Suspense fallback={<section className="mx-auto min-h-[320px] max-w-6xl" />}>
        <ArtistGrid display={display} />
      </Suspense>
      <VisitCta image={display.visitImage} />
    </>
  );
}
