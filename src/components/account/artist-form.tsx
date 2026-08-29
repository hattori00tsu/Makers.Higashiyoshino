"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Field,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/account/fields";
import {
  formatArtistGenres,
  genres,
  newArtistLink,
  parseArtistGenres,
  type ArtistDraft,
} from "@/lib/account/types";
import { useSession } from "@/lib/account/use-session";
import { loadEventOptions } from "@/lib/content/live";
import { optionNames } from "@/lib/content/options";
import { blobToDataUrl, compressImage } from "@/lib/image/compress";

type Props = {
  initial: ArtistDraft;
  submitLabel: string;
  onSave: (draft: ArtistDraft) => Promise<void> | void;
  showSlug?: boolean;
  showStatus?: boolean;
  email?: string;
};

export function ArtistForm({
  initial,
  submitLabel,
  onSave,
  showSlug = false,
  showStatus = false,
  email,
}: Props) {
  const { user } = useSession();
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [genreOptions, setGenreOptions] = useState<string[]>([...genres]);

  useEffect(() => {
    let active = true;
    loadEventOptions(user?.source === "preview").then((options) => {
      if (active) setGenreOptions(optionNames(options.genres));
    });
    return () => {
      active = false;
    };
  }, [user?.source]);

  function set<K extends keyof ArtistDraft>(key: K, value: ArtistDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchLink(id: string, patch: { name?: string; url?: string }) {
    setDraft((current) => ({
      ...current,
      links: current.links.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  async function onImage(file?: File) {
    if (!file) return;
    const local = URL.createObjectURL(file);
    set("image", local);
    try {
      const blob = await compressImage(file);
      const dataUrl = await blobToDataUrl(blob);
      set("image", dataUrl);
      window.setTimeout(() => URL.revokeObjectURL(local), 1500);
    } catch {
      setMessage("画像を読み込めませんでした。");
      URL.revokeObjectURL(local);
    }
  }

  function toggleGenre(name: string) {
    setDraft((current) => {
      const selected = parseArtistGenres(current.genre);
      const next = selected.includes(name)
        ? selected.filter((item) => item !== name)
        : [...selected, name];
      const ordered = [
        ...genreOptions.filter((item) => next.includes(item)),
        ...next.filter((item) => !genreOptions.includes(item)),
      ];
      return { ...current, genre: formatArtistGenres(ordered) };
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (parseArtistGenres(draft.genre).length === 0) {
      setMessage("カテゴリーを選んでください。");
      return;
    }
    if (draft.image.startsWith("blob:")) {
      setMessage("画像の処理が終わるまで待ってください。");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await onSave({ ...draft, genre: formatArtistGenres(draft.genre) });
      setMessage("保存しました。");
    } catch (error) {
      const text = error instanceof Error ? error.message.trim() : "";
      setMessage(text || "保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  const preview = draft.image.trim();
  const selectedGenres = parseArtistGenres(draft.genre);
  const listedGenres = [
    ...genreOptions,
    ...selectedGenres.filter((item) => !genreOptions.includes(item)),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {showSlug ? (
          <Field label="公開URL">
            <TextInput
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="例：tanaka-kei"
            />
          </Field>
        ) : null}
        {showStatus ? (
          <Field label="公開">
            <Select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as ArtistDraft["status"])}
            >
              <option value="approved">公開</option>
              <option value="rejected">非公開</option>
              {draft.status === "pending" ? <option value="pending">確認待ち</option> : null}
            </Select>
          </Field>
        ) : null}
        {email !== undefined ? (
          <Field label="メールアドレス">
            <p className="border border-transparent py-2.5 text-sm text-sumi">{email || "未登録"}</p>
          </Field>
        ) : null}
        <Field label="名前">
          <TextInput value={draft.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="よみ">
          <TextInput value={draft.reading} onChange={(e) => set("reading", e.target.value)} />
        </Field>
        <Field label="地区">
          <TextInput
            value={draft.area}
            onChange={(e) => set("area", e.target.value)}
            placeholder="鷲家、小川など"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="カテゴリー">
            <ul className="grid gap-2 sm:grid-cols-2">
              {listedGenres.map((genre) => (
                <li key={genre}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                    />
                    {genre}
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-6 text-sumi-soft">木工と陶芸など、複数選べます。</p>
          </Field>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[12px] tracking-[0.14em] text-sumi-soft">プロフィール画像</p>
        <div className="relative aspect-square w-full max-w-xs overflow-hidden border border-line bg-kami">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-[12px] tracking-[0.14em] text-sumi-soft">画像をアップロード</span>
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            onChange={(e) => onImage(e.target.files?.[0])}
          />
        </label>
        {draft.image ? (
          <button
            type="button"
            className="mt-2 text-[13px] tracking-[0.14em] text-sumi-soft"
            onClick={() => set("image", "")}
          >
            画像を外す
          </button>
        ) : (
          <p className="mt-2 text-xs leading-6 text-sumi-soft">
            顔写真ではなく、工房や仕事の様子がよいです。長辺1600px・WebPに整えます。
          </p>
        )}
      </div>

      <Field label="短い紹介">
        <TextInput value={draft.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <Field label="自己紹介">
        <TextArea value={draft.profile} onChange={(e) => set("profile", e.target.value)} />
      </Field>

      <div className="space-y-4 border-t border-line pt-6">
        <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
          <input
            type="checkbox"
            className="mt-1.5"
            checked={draft.i18nEnabled}
            onChange={(e) => set("i18nEnabled", e.target.checked)}
          />
          <span>
            英語の文章を公開する
            <span className="block text-xs leading-6">英語版に切り替えたときに出します。空の項目は日本語のままです。</span>
          </span>
        </label>
        {draft.i18nEnabled ? (
          <div className="space-y-4">
            <Field label="名前（英語）">
              <TextInput value={draft.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
            </Field>
            <Field label="地区（英語）">
              <TextInput value={draft.areaEn} onChange={(e) => set("areaEn", e.target.value)} />
            </Field>
            <Field label="短い紹介（英語）">
              <TextInput value={draft.bioEn} onChange={(e) => set("bioEn", e.target.value)} />
            </Field>
            <Field label="自己紹介（英語）">
              <TextArea value={draft.profileEn} onChange={(e) => set("profileEn", e.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="工房の名前">
          <TextInput
            value={draft.studioName}
            onChange={(e) => set("studioName", e.target.value)}
            placeholder="工房の名前"
          />
        </Field>
        <Field label="Google 地図">
          <TextInput
            value={draft.studioMapUrl}
            onChange={(e) => set("studioMapUrl", e.target.value)}
            placeholder="Google 地図のリンク"
          />
        </Field>
      </div>
      <Field label="見学について">
        <TextArea value={draft.studioVisit} onChange={(e) => set("studioVisit", e.target.value)} />
      </Field>
      {draft.i18nEnabled ? (
        <Field label="見学について（英語）">
          <TextArea value={draft.studioVisitEn} onChange={(e) => set("studioVisitEn", e.target.value)} />
        </Field>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Instagram">
          <TextInput
            value={draft.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="https://www.instagram.com/yourname/"
          />
        </Field>
        <Field label="表示する投稿（任意）">
          <TextInput
            value={draft.instagramPermalink}
            onChange={(e) => set("instagramPermalink", e.target.value)}
            placeholder="https://www.instagram.com/p/..."
          />
          <p className="text-xs leading-6 text-sumi-soft">
            最新など、ページに埋め込みたい投稿のURL。空ならプロフィールを埋め込みます。
          </p>
        </Field>
        <Field label="Facebook">
          <TextInput
            value={draft.facebook}
            onChange={(e) => set("facebook", e.target.value)}
            placeholder="https://"
          />
        </Field>
      </div>

      <div>
        <p className="mb-3 text-[12px] tracking-[0.14em] text-sumi-soft">その他のリンク</p>
        <div className="space-y-4">
          {draft.links.map((link) => (
            <div key={link.id} className="grid gap-3 border border-line px-3 py-3 md:grid-cols-[1fr_1fr_auto]">
              <Field label="名前">
                <TextInput
                  value={link.name}
                  onChange={(e) => patchLink(link.id, { name: e.target.value })}
                  placeholder="Shop、X など"
                />
              </Field>
              <Field label="リンク">
                <TextInput
                  value={link.url}
                  onChange={(e) => patchLink(link.id, { url: e.target.value })}
                  placeholder="https://"
                />
              </Field>
              <button
                type="button"
                className="self-end pb-2.5 text-left text-sm text-sumi-soft"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    links: current.links.filter((item) => item.id !== link.id),
                  }))
                }
              >
                削除
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-[13px] tracking-[0.14em] text-sugi"
          onClick={() => setDraft((current) => ({ ...current, links: [...current.links, newArtistLink()] }))}
        >
          リンクを足す
        </button>
      </div>

      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "保存中" : submitLabel}
        </PrimaryButton>
        {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      </div>
    </form>
  );
}
