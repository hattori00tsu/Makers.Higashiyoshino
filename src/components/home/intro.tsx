import Image from "next/image";
import {
  defaultHomeVillage,
  defaultVillageImage,
  resolveHomeImage,
  type HomeVillage,
} from "@/lib/content/home-display";

export function Intro({ village }: { village?: HomeVillage }) {
  const content = village ?? defaultHomeVillage();
  const src = resolveHomeImage(content.image, defaultVillageImage);
  const paragraphs = content.summary
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden md:col-span-5">
          <Image
            src={src}
            alt={content.title || "山村の家並み"}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
          />
        </div>
        <div className="md:col-span-7 md:py-6">
          <p className="text-[11px] tracking-[0.28em] text-tsuchi">
            01<span className="ml-3 text-sumi-soft">VILLAGE</span>
          </p>
          {content.title ? (
            <h2 className="mt-3 font-serif text-[1.65rem] leading-snug tracking-wide md:text-3xl">
              {content.title}
            </h2>
          ) : null}
          {content.schedule ? (
            <p className={`${content.title ? "mt-4" : "mt-6"} text-[13px] tracking-[0.14em] text-tsuchi`}>
              {content.schedule}
            </p>
          ) : null}
          {paragraphs.length > 0 ? (
            <div className="mt-8 space-y-6 text-[15px] leading-8 text-sumi-soft md:max-w-xl">
              {paragraphs.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
