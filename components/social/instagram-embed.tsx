"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

type Props = {
  permalink: string;
};

export function InstagramEmbed({ permalink }: Props) {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const process = () => window.instgrm?.Embeds.process();
    if (window.instgrm) {
      process();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]',
    );
    if (existing) {
      existing.addEventListener("load", process);
      return () => existing.removeEventListener("load", process);
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, [permalink]);

  return (
    <blockquote
      ref={ref}
      className="instagram-media"
      data-instgrm-permalink={permalink}
      data-instgrm-version="14"
      style={{ margin: 0, maxWidth: 540, width: "100%" }}
    >
      <a href={permalink} target="_blank" rel="noreferrer">
        Instagram で見る
      </a>
    </blockquote>
  );
}
