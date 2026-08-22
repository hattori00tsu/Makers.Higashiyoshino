import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";

export function Intro() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-12 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden md:col-span-5">
          <Image
            src="/images/3.jpg"
            alt="山村の家並み"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
          />
        </div>
        <div className="md:col-span-7 md:py-6">
          <SectionHeading index="01" eyebrow="VILLAGE" title="育てる場所。育てられる場所。" />
          <div className="mt-8 space-y-6 text-[15px] leading-8 text-sumi-soft md:max-w-xl">
            <p>
            東吉野に根を張り、つくることを生業にしようとしている人たちがいる。 Makers.Higashiyoshino は、その発表の場であり、協働の器。 それぞれが目標を掲げ、挑戦し、互いの仕事が響き合う。
            </p>
            <p>
            ここにあるものは、見て、触れて、飲んで、食べて──五感を通してはじめて伝わる。 来てくれた人との出会いも含めて、ここで起きることのすべてが、次へとつながっていく。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
