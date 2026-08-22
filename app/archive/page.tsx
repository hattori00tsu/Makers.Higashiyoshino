import { Suspense } from "react";
import type { Metadata } from "next";
import { ArchiveView } from "@/components/events/archive-view";
import { loadPublicEvents } from "@/lib/content/public-events";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "アーカイブ",
};

export default async function ArchivePage() {
  const all = await loadPublicEvents();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28">
          <p className="text-sm text-sumi-soft">読み込み中です。</p>
        </div>
      }
    >
      <ArchiveView all={all} />
    </Suspense>
  );
}
