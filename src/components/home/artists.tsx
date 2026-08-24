import { loadPublicArtists } from "@/lib/content/public-artists";
import { arrangeHomeArtists, type HomeDisplay } from "@/lib/content/home-display";
import { ArtistGridView } from "@/components/home/artist-grid-view";

export async function ArtistGrid({ display }: { display: HomeDisplay }) {
  const artists = await loadPublicArtists();

  return (
    <ArtistGridView
      artists={arrangeHomeArtists(artists, display)}
      shuffleOnLoad={display.artistsMode === "random"}
    />
  );
}
