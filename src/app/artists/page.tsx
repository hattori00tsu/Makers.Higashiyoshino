import type { Metadata } from "next";
import { ArtistsBrowser } from "@/components/artists/artists-browser";
import { artistsPastEventsBySlug } from "@/lib/calendar";
import { loadPublicArtists } from "@/lib/content/public-artists";
import { loadPublicEvents } from "@/lib/content/public-events";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "つくり手",
};

export default async function ArtistsPage() {
  const [artists, events] = await Promise.all([loadPublicArtists(), loadPublicEvents()]);
  const history = artistsPastEventsBySlug(
    artists.map((artist) => artist.slug),
    events,
  );

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARTISTS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">つくり手</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-sumi-soft">
        つくり手たち。
      </p>
      <ArtistsBrowser artists={artists} history={history} />
    </div>
  );
}
