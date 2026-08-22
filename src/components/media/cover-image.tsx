"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
};

export function CoverImage({ src, alt, className = "object-cover" }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolved = src.trim();
  if (failed || !resolved) {
    return <div className="absolute inset-0 bg-kami" aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
