"use client";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-5 pt-28 pb-20">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ERROR</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">表示できませんでした</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        ページの読み込み中に問題が起きました。もう一度お試しください。
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 text-[13px] tracking-[0.16em] text-sugi underline decoration-line underline-offset-4"
      >
        再読み込み
      </button>
    </div>
  );
}
