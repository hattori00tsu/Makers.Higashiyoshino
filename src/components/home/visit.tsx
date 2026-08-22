import Image from "next/image";
import Link from "next/link";

export function VisitCta() {
  return (
    <section className="relative min-h-[520px] overflow-hidden md:min-h-[560px]">
      <Image
        src="/images/4.jpg"
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
          <Link
            href="/guide"
            className="inline-flex w-fit px-6 py-3 text-[13px] tracking-[0.18em] text-kami/90 underline decoration-kami/40 underline-offset-4"
          >
            アクセスと周辺案内
          </Link>
        </div>
      </div>
    </section>
  );
}
