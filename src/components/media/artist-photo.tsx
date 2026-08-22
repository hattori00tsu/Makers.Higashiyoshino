"use client";

import { defaultArtistImage } from "@/data/site";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export function ArtistPhoto({ src, alt, className = "object-cover" }: Props) {
  const resolved = typeof src === "string" ? src.trim() : "";
  if (!resolved || resolved === defaultArtistImage) {
    return <div className="absolute inset-0 bg-kami" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolved} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
  );
}
