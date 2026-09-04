import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { CoverImage } from "@/components/media/cover-image";
import { eventAncestorTitle, eventCover, isPublished, type EventItem } from "@/data/site";
import { arrangeHomeEvents, arrangeHomeVenues, type HomeDisplay } from "@/lib/content/home-display";
import { loadPublicEvents } from "@/lib/content/public-events";
import { loadPublicEventOptions } from "@/lib/content/public-options";
import type { EventOptions } from "@/lib/content/options";
import { formatMonthDaySpan } from "@/lib/dates";
import { localizedCategoryLabel, localizedEvents } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/locale";
import { getLocale, getMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/messages";

export async function EventHighlights({ display }: { display: HomeDisplay }) {
  const locale = await getLocale();
  const t = await getMessages();
  const [all, options] = await Promise.all([loadPublicEvents(), loadPublicEventOptions()]);
  const catalog = localizedEvents(all.filter(isPublished), locale, options);
  const venues = arrangeHomeVenues(catalog, display);
  const programs = arrangeHomeEvents(catalog, display);

  return (
    <>
      {venues.length > 0 ? (
        <HighlightBand
          items={venues}
          catalog={catalog}
          locale={locale}
          options={options}
          t={t}
          wide
          className={
            programs.length > 0
              ? "border-t border-line py-20 md:py-28"
              : "border-y border-line py-20 md:py-28"
          }
        />
      ) : null}
      {programs.length > 0 || venues.length === 0 ? (
        <HighlightBand
          eyebrow="EVENTS"
          title=""
          items={programs}
          catalog={catalog}
          locale={locale}
          options={options}
          t={t}
          className="border-y border-line bg-kami/60 py-20 md:py-28"
          emptyLabel={t.home.noEvents}
        />
      ) : null}
    </>
  );
}

function HighlightBand({
  eyebrow,
  title,
  items,
  catalog,
  locale,
  options,
  t,
  className,
  emptyLabel,
  wide = false,
}: {
  eyebrow?: string;
  title?: string;
  items: EventItem[];
  catalog: EventItem[];
  locale: Locale;
  options: EventOptions;
  t: Messages;
  className: string;
  emptyLabel?: string;
  wide?: boolean;
}) {
  const gridClass = wide
    ? items.length === 1
      ? "md:max-w-3xl md:grid-cols-1"
      : items.length === 2
        ? "md:max-w-6xl md:grid-cols-2"
        : "md:max-w-6xl md:grid-cols-3"
    : "md:max-w-6xl md:grid-cols-3";
  const heading = Boolean(eyebrow || title);

  return (
    <section className={className}>
      {heading ? (
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            index=""
            eyebrow={eyebrow}
            title={title ?? ""}
            action={
              <Link
                href="/events"
                className="hidden text-[13px] tracking-[0.16em] text-sugi md:inline hover:opacity-70"
              >
                {t.common.details}
              </Link>
            }
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="mx-auto mt-10 max-w-6xl px-5 text-sm leading-7 text-sumi-soft md:mt-12 md:px-8">
          {emptyLabel}
          <Link href="/events" className="ml-2 underline decoration-line underline-offset-4">
            {t.common.details}
          </Link>
        </p>
      ) : (
        <div
          className={`flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-auto md:grid md:gap-8 md:overflow-visible md:px-8 ${gridClass} ${
            heading ? "mt-10 md:mt-12" : ""
          }`}
        >
          {items.map((event) => {
            const cover = eventCover(event.image);
            const ancestor = eventAncestorTitle(event, catalog);
            return (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className={`block shrink-0 snap-start md:w-full md:max-w-none ${
                  wide ? "w-[88vw] max-w-[28rem]" : "w-[78vw] max-w-[320px]"
                }`}
              >
                <article>
                  {cover ? (
                    <div
                      className={`relative w-full overflow-hidden ${
                        wide ? "aspect-[16/10]" : "aspect-[4/5]"
                      }`}
                    >
                      <CoverImage
                        src={cover}
                        alt={event.title}
                        sizes={
                          wide
                            ? "(max-width: 768px) 88vw, 48rem"
                            : "(max-width: 768px) 78vw, 30vw"
                        }
                        className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <p className={`text-[11px] tracking-[0.18em] text-tsuchi ${cover ? "mt-4" : ""}`}>
                    {ancestor ? (
                      <>
                        {ancestor}
                        <span className="mx-2 text-line">/</span>
                      </>
                    ) : null}
                    {localizedCategoryLabel(event.categories, locale, options.categories)}
                    <span className="mx-2 text-line">/</span>
                    {formatMonthDaySpan(event.sessions, locale)}
                  </p>
                  <h3 className="mt-2 font-serif text-xl tracking-wide">{event.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-sumi-soft">{event.summary}</p>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {heading && items.length > 0 ? (
        <div className="mt-8 px-5 md:hidden">
          <Link href="/events" className="text-[13px] tracking-[0.16em] text-sugi">
            {t.common.details}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
