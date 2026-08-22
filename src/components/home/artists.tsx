import { loadPublicArtists } from "@/lib/content/public-artists";
import { arrangeHomeArtists } from "@/lib/content/home-display";
import { loadPublicHomeDisplay } from "@/lib/content/public-home-display";
import { ArtistGridView } from "@/components/home/artist-grid-view";

export async function ArtistGrid() {
  const [artists, display] = await Promise.all([loadPublicArtists(), loadPublicHomeDisplay()]);

  return (
    <ArtistGridView
      artists={arrangeHomeArtists(artists, display)}
      shuffleOnLoad={display.artistsMode === "random"}
    />
  );
}
