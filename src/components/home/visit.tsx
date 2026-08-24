import Image from "next/image";
import Link from "next/link";
import { defaultVisitImage, resolveHomeImage } from "@/lib/content/home-display";

export function VisitCta({ image }: { image?: string }) {
  const src = resolveHomeImage(image, defaultVisitImage);

  return (
    <section className="relative min-h-[520px] overflow-hidden md:min-h-[560px]">
      <Image
        src={src}
        alt="森の道"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(44,36,22,0.78)_0%,rgba(44,36,22,0.38)_58%,rgba(44,36,22,0.12)_100%)]" />

      <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col justify-end px-5 py-16 md:min-h-[560px] md:justify-center md:px-8">
        <p className="text-[11px] tracking-[0.28em] text-kami/70">04 VISIT</p>
        <h2 className="mt-3 font-serif text-3xl tracking-wide text-kami md:text-4xl">
          村を訪ねる
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/map"
            className="inline-flex w-fit border border-kami/50 px-6 py-3 text-[13px] tracking-[0.18em] text-kami transition-colors hover:bg-kami hover:text-sumi"
          >
            村内マップ
          </Link>
        </div>
      </div>
    </section>
  );
}
