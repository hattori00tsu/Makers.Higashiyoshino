import type { Metadata } from "next";
import { ArtistsBrowser } from "@/components/artists/artists-browser";
import { loadPublicArtists } from "@/lib/content/public-artists";
import { getMessages } from "@/lib/i18n/server";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.artists.title };
}

export default async function ArtistsPage() {
  const t = await getMessages();
  const artists = await loadPublicArtists();

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARTISTS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{t.artists.title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-sumi-soft">
        {t.artists.lead}
      </p>
      <ArtistsBrowser artists={artists} />
    </div>
  );
}
