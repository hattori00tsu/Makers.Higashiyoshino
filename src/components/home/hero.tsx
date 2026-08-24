import Image from "next/image";
import {
  defaultHeroImage,
  defaultHomeHero,
  resolveHomeImage,
  splitCopyLines,
  type HomeHero,
} from "@/lib/content/home-display";

export function Hero({ hero }: { hero?: HomeHero }) {
  const content = hero ?? defaultHomeHero();
  const src = resolveHomeImage(content.image, defaultHeroImage);
  const titleLines = splitCopyLines(content.title);
  const leadLines = splitCopyLines(content.lead);

  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
      <Image
        src={src}
        alt={titleLines[0] || "霧のかかる山と森"}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(44,36,22,0.78)_0%,rgba(44,36,22,0.18)_42%,rgba(44,36,22,0.22)_100%)]" />

      {content.sideLabel ? (
        <p className="absolute top-1/2 right-4 hidden -translate-y-1/2 font-serif text-[12px] tracking-[0.42em] text-kami/80 [writing-mode:vertical-rl] md:right-8 md:block">
          {content.sideLabel}
        </p>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 px-5 pb-14 md:px-12 md:pb-16">
        {content.eyebrow ? (
          <p className="text-[11px] tracking-[0.32em] text-kami/80">{content.eyebrow}</p>
        ) : null}
        {titleLines.length > 0 ? (
          <h1 className={`${content.eyebrow ? "mt-4" : ""} max-w-xl font-serif text-[2.05rem] leading-[1.35] tracking-wide text-kami md:text-5xl`}>
            {titleLines.map((line, index) => (
              <span key={index}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>
        ) : null}
        {leadLines.length > 0 ? (
          <p className="mt-5 max-w-md text-sm leading-7 text-kami/90 md:text-[15px]">
            {leadLines.map((line, index) => (
              <span key={index}>
                {index > 0 ? <br className="hidden sm:block" /> : null}
                {index > 0 ? " " : null}
                {line}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}
