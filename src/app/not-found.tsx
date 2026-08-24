import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 pt-20">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">404</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">ページが見つかりません</h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        アドレスが変わったか、まだ公開していないページです。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit border border-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] hover:bg-sumi hover:text-kami"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
