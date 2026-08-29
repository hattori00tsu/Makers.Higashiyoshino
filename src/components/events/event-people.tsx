import Link from "next/link";
import { getMessages } from "@/lib/i18n/server";

type Person = { slug: string; name: string; genre: string };

export async function EventPeople({ people }: { people: Person[] }) {
  const t = await getMessages();
  if (people.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl tracking-wide">{t.events.people}</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {people.map((artist) => (
          <li key={artist.slug}>
            <Link
              href={`/artists/${artist.slug}`}
              className="flex items-center justify-between py-4 text-sm hover:text-sugi"
            >
              <span className="font-serif text-base tracking-wide">{artist.name}</span>
              <span className="tracking-[0.14em] text-sumi-soft">{artist.genre}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
