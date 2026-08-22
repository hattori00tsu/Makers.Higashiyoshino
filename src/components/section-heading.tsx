import type { ReactNode } from "react";

type Props = {
  index: string;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
};

export function SectionHeading({ index, eyebrow, title, action }: Props) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="space-y-3">
        <p className="text-[11px] tracking-[0.28em] text-tsuchi">
          {index}
          {eyebrow ? <span className="ml-3 text-sumi-soft">{eyebrow}</span> : null}
        </p>
        <h2 className="font-serif text-[1.65rem] leading-snug tracking-wide md:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
