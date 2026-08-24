import { site } from "@/data/site";
import { googleMapsEmbedUrl } from "@/lib/maps-url";

export function VillageMap() {
  return (
    <div className="overflow-hidden border border-line">
      <iframe
        title="東吉野村の地図"
        src={googleMapsEmbedUrl("東吉野村")}
        className="h-[52vh] min-h-[320px] w-full border-0 md:h-[62vh]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
