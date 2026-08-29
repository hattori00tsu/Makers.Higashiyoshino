import { Suspense } from "react";
import type { Metadata } from "next";
import { ArchiveView } from "@/components/events/archive-view";
import { loadPublicEvents } from "@/lib/content/public-events";
import { getMessages } from "@/lib/i18n/server";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.archive.title };
}

export default async function ArchivePage() {
  const t = await getMessages();
  const all = await loadPublicEvents();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28">
          <p className="text-sm text-sumi-soft">{t.common.loading}</p>
        </div>
      }
    >
      <ArchiveView all={all} />
    </Suspense>
  );
}
