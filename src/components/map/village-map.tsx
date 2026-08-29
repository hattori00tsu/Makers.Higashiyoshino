import { villageMapPlace } from "@/data/site";

export function VillageMap() {
  return (
    <div>
      <div className="overflow-hidden border border-line">
        <iframe
          title={`${villageMapPlace.name}の地図`}
          src={villageMapPlace.embedUrl}
          className="h-[52vh] min-h-[320px] w-full border-0 md:h-[62vh]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="mt-4 font-serif text-lg tracking-wide">{villageMapPlace.name}</p>
      <p className="mt-2">
        <a
          href={villageMapPlace.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] tracking-[0.16em] text-sugi underline decoration-line underline-offset-4"
        >
          Google マップで開く
        </a>
      </p>
    </div>
  );
}
