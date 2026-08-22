import type { PlaceOption } from "@/data/site";

export function EventPlaceList({
  venues,
  parkings,
}: {
  venues: PlaceOption[];
  parkings: PlaceOption[];
}) {
  if (venues.length === 0 && parkings.length === 0) return null;

  return (
    <div className="mt-10">
      <NamedPlaces label="会場" places={venues} />
      <NamedPlaces label="駐車場" places={parkings} />
    </div>
  );
}

function NamedPlaces({ label, places }: { label: string; places: PlaceOption[] }) {
  if (places.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-[11px] tracking-[0.22em] text-tsuchi">{label}</p>
      <ul className="mt-3 space-y-1 text-sm leading-7 text-sumi-soft">
        {places.map((place) => (
          <li key={place.id || place.title}>
            {place.url ? (
              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-4"
              >
                {place.title}
              </a>
            ) : (
              place.title
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
