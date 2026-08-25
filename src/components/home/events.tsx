import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { CoverImage } from "@/components/media/cover-image";
import { eventCategoryLabel, eventCover, isPublished } from "@/data/site";
import { arrangeHomeEvents, type HomeDisplay } from "@/lib/content/home-display";
import { loadPublicEvents } from "@/lib/content/public-events";
import { formatMonthDaySpan } from "@/lib/dates";

export async function EventHighlights({ display }: { display: HomeDisplay }) {
  const all = await loadPublicEvents();
  const items = arrangeHomeEvents(all.filter(isPublished), display);

  return (
    <section className="border-y border-line bg-kami/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index=""
          eyebrow="EVENTS"
          title="直近の催し"
          action={
            <Link
              href="/events"
              className="hidden text-[13px] tracking-[0.16em] text-sugi md:inline hover:opacity-70"
            >
              詳細
            </Link>
          }
        />
      </div>

      {items.length === 0 ? (
        <p className="mx-auto mt-10 max-w-6xl px-5 text-sm leading-7 text-sumi-soft md:mt-12 md:px-8">
          いま公開中の催しはありません。
          <Link href="/events" className="ml-2 underline decoration-line underline-offset-4">
            詳細
          </Link>
        </p>
      ) : (
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-auto md:mt-12 md:max-w-6xl md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-8">
          {items.map((event) => {
            const cover = eventCover(event.image);
            return (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="block w-[78vw] max-w-[320px] shrink-0 snap-start md:w-full md:max-w-none"
              >
                <article>
                  {cover ? (
                    <div className="relative aspect-[4/5] w-full overflow-hidden">
                      <CoverImage
                        src={cover}
                        alt={event.title}
                        sizes="(max-width: 768px) 78vw, 30vw"
                        className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <p className={`text-[11px] tracking-[0.18em] text-tsuchi ${cover ? "mt-4" : ""}`}>
                    {eventCategoryLabel(event.categories)}
                    <span className="mx-2 text-line">/</span>
                    {formatMonthDaySpan(event.sessions)}
                  </p>
                  <h3 className="mt-2 font-serif text-xl tracking-wide">{event.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-sumi-soft">{event.summary}</p>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {items.length > 0 ? (
        <div className="mt-8 px-5 md:hidden">
          <Link href="/events" className="text-[13px] tracking-[0.16em] text-sugi">
            詳細
          </Link>
        </div>
      ) : null}
    </section>
  );
}
