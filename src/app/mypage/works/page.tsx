"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MypageNav } from "@/components/account/mypage-nav";
import { TextInput } from "@/components/account/fields";
import { blobToDataUrl, compressImage } from "@/lib/image/compress";
import { getLocalAccount, saveLocalWorks } from "@/lib/account/local";
import {
  addRemoteWork,
  deleteRemoteWork,
  fetchRemoteArtist,
} from "@/lib/account/remote";
import { useSession } from "@/lib/account/use-session";
import type { WorkDraft } from "@/lib/account/types";

export default function WorksPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [works, setWorks] = useState<WorkDraft[]>([]);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const approved = user?.artistStatus === "approved";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/mypage/works");
      return;
    }
    if (user.artistStatus === "none") {
      router.replace("/mypage");
      return;
    }
    async function load() {
      if (!user) return;
      if (user.source === "preview") {
        setWorks(getLocalAccount(user.id)?.works ?? []);
        return;
      }
      const remote = await fetchRemoteArtist(user.id);
      setWorks(remote.works);
      setArtistId(remote.artistId);
    }
    load();
  }, [user, loading, router]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  async function onFile(file: File | undefined) {
    if (!file || !user) return;
    setBusy(true);
    try {
      if (user.source === "preview") {
        const blob = await compressImage(file);
        const src = await blobToDataUrl(blob);
        const next = [...works, { id: crypto.randomUUID(), src, title: title || file.name }];
        setWorks(next);
        saveLocalWorks(user.id, next);
      } else if (artistId) {
        await addRemoteWork(user.id, artistId, file, title || file.name);
        const remote = await fetchRemoteArtist(user.id);
        setWorks(remote.works);
      }
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!user) return;
    if (user.source === "preview") {
      const next = works.filter((work) => work.id !== id);
      setWorks(next);
      saveLocalWorks(user.id, next);
      return;
    }
    await deleteRemoteWork(id);
    setWorks((current) => current.filter((work) => work.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">WORKS</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">作品</h1>
      <MypageNav />

      {!approved ? (
        <p className="text-sm leading-7 text-sumi-soft">
          作品の投稿は、作家登録のあと開けます。
        </p>
      ) : (
        <>
          <div className="space-y-4 border border-line bg-kami px-4 py-5">
            <p className="text-[12px] tracking-[0.14em] text-sumi-soft">
              画像は長辺1600px・WebPに整えてから保存します。
            </p>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="作品名"
            />
            <label className="block">
              <span className="text-[12px] tracking-[0.14em] text-sumi-soft">画像を追加</span>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                disabled={busy}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
            {works.map((work) => (
              <li key={work.id}>
                <div className="relative aspect-square overflow-hidden bg-kami">
                  {work.src.startsWith("http") || work.src.startsWith("/") ? (
                    <Image src={work.src} alt={work.title} fill className="object-cover" sizes="40vw" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={work.src} alt={work.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-2 text-sm text-sumi-soft">{work.title}</p>
                <button
                  type="button"
                  className="mt-1 text-[12px] tracking-wide text-sugi"
                  onClick={() => remove(work.id)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
          {works.length === 0 ? (
            <p className="mt-8 text-sm text-sumi-soft">まだ作品がありません。</p>
          ) : null}
          {busy ? <p className="mt-4 text-sm text-sumi-soft">処理中です。</p> : null}
        </>
      )}
    </div>
  );
}
