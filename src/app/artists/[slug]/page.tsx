import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VenueMap, isGoogleMapsUrl } from "@/components/events/venue-map";
import { InstagramEmbed } from "@/components/social/instagram-embed";
import { ArtistEvents } from "@/components/artists/artist-events";
import { ArtistPhoto } from "@/components/media/artist-photo";
import { loadPublicArtist, loadPublicArtists } from "@/lib/content/public-artists";
import { loadPublicEventsForArtist } from "@/lib/content/public-events";
import { instagramEmbedPermalink } from "@/lib/social/instagram";
import type { Artist } from "@/data/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const artists = await loadPublicArtists();
  return artists.map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await loadPublicArtist(slug);
  return { title: artist?.name ?? "作家" };
}

function hasStudio(artist: Artist) {
  return Boolean(
    (artist.studio?.address ?? "").trim() ||
      (artist.studio?.visit ?? "").trim() ||
      ((artist.studio?.query ?? "").trim() && isGoogleMapsUrl(artist.studio?.query ?? "")),
  );
}

export default async function ArtistDetailPage({ params }: Props) {
  const { slug } = await params;
  const [artist, events] = await Promise.all([loadPublicArtist(slug), loadPublicEventsForArtist(slug)]);
  if (!artist) notFound();

  const extraLinks = [
    ...(artist.x ? [{ href: artist.x, label: "X" }] : []),
    ...(artist.shop ? [{ href: artist.shop, label: "Shop" }] : []),
    ...(artist.links ?? [])
      .filter((link) => link.name && link.url)
      .map((link) => ({ href: link.url, label: link.name })),
  ];
  const links = [
    artist.instagram ? { href: artist.instagram, label: "Instagram" } : null,
    artist.facebook ? { href: artist.facebook, label: "Facebook" } : null,
    ...extraLinks,
  ].filter((item): item is { href: string; label: string } => Boolean(item));
  const instagramEmbed = instagramEmbedPermalink(artist.instagram, artist.instagramPermalink);
  const studioOpen = hasStudio(artist);

  return (
    <article className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <div className="grid gap-10 md:grid-cols-12 md:gap-16">
        <div className="relative aspect-square overflow-hidden bg-kami md:col-span-5 md:aspect-[4/5]">
          <ArtistPhoto src={artist.image} alt={artist.name} />
        </div>
        <div className="md:col-span-7 md:pt-4">
          <p className="text-[11px] tracking-[0.18em] text-tsuchi">
            {artist.genre}
            {artist.area ? (
              <>
                <span className="mx-2 text-line">/</span>
                {artist.area}
              </>
            ) : null}
          </p>
          <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{artist.name}</h1>
          <p className="mt-2 text-sm tracking-wide text-sumi-soft">{artist.reading}</p>
          <p className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-sumi-soft">{artist.profile}</p>

          {links.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <a
                    href={link.href}
                    className="tracking-[0.12em] underline decoration-line underline-offset-4 hover:text-sugi"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {artist.works.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-serif text-xl tracking-wide">作品</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {artist.works.map((work) => (
              <li key={work.src + work.title}>
                <div className="relative aspect-square overflow-hidden bg-kami">
                  <ArtistPhoto src={work.src} alt={work.title} />
                </div>
                <p className="mt-2 text-sm text-sumi-soft">{work.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {studioOpen ? (
        <section className="mt-16">
          <h2 className="font-serif text-xl tracking-wide">工房</h2>
          {artist.studio.address ? (
            <p className="mt-3 text-sm leading-7 text-sumi-soft">{artist.studio.address}</p>
          ) : null}
          {artist.studio.visit ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-sumi-soft">{artist.studio.visit}</p>
          ) : null}
          {isGoogleMapsUrl(artist.studio.query) ? (
            <div className="mt-6">
              <VenueMap
                url={artist.studio.query}
                title={artist.studio.address || `${artist.name}の工房`}
              />
              <p className="mt-3 text-sm text-sumi-soft">
                <a
                  href={artist.studio.query}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line underline-offset-4 hover:text-sugi"
                >
                  Google マップで開く
                </a>
              </p>
            </div>
          ) : null}
          <p className="mt-3 text-sm text-sumi-soft">
            村の全体図は
            <Link
              href="/map"
              className="mx-1 underline decoration-line underline-offset-4"
            >
              地図
            </Link>
            からどうぞ。
          </p>
        </section>
      ) : null}

      {instagramEmbed ? (
        <section className="mt-16">
          <h2 className="font-serif text-xl tracking-wide">SNS</h2>
          <div className="mt-6 max-w-md">
            <InstagramEmbed key={instagramEmbed} permalink={instagramEmbed} />
          </div>
        </section>
      ) : null}

      <ArtistEvents slug={artist.slug} initial={events} />
    </article>
  );
}
