import Image from "next/image";

export function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
      <Image
        src="/images/2.jpg"
        alt="霧のかかる山と森"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(44,36,22,0.78)_0%,rgba(44,36,22,0.18)_42%,rgba(44,36,22,0.22)_100%)]" />

      <p className="absolute top-1/2 right-4 hidden -translate-y-1/2 font-serif text-[12px] tracking-[0.42em] text-kami/80 [writing-mode:vertical-rl] md:right-8 md:block">
        奈良県東吉野村
      </p>

      <div className="absolute inset-x-0 bottom-0 px-5 pb-14 md:px-12 md:pb-16">
        <p className="text-[11px] tracking-[0.32em] text-kami/80">NARA HIGASHIYOSHINO</p>
        <h1 className="mt-4 max-w-xl font-serif text-[2.05rem] leading-[1.35] tracking-wide text-kami md:text-5xl">
          奥山に根ざす、
          <br />
          つくり手たちの記録。
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-kami/90 md:text-[15px]">
          Deep in the mountains, far from the noise.
          <br className="hidden sm:block" />
          Makers rooted in Higashiyoshino, Nara. Curated by Okuyama House.
        </p>
      </div>
    </section>
  );
}
