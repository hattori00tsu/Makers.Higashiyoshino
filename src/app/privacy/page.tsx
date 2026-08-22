import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${site.name}における個人情報の取り扱いについて。`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">PRIVACY</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">
        プライバシーポリシー
      </h1>
      <p className="mt-4 text-sm leading-7 text-sumi-soft">
        {site.name}（以下「本サイト」）は、催しの申込みと作家登録のために預かった情報を、次のとおり取り扱います。
      </p>

      <div className="mt-14 space-y-14 text-sm leading-7 text-sumi-soft">
        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">取得する情報</h2>
          <p className="mt-4">本サイトが取得するのは、次の情報です。</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              催しの申込み：お名前、メールアドレス、人数、連絡事項、対象の催しと日程。申込みにはログインが必要です
            </li>
            <li>
              来訪者・作家・運営のログイン：メールアドレス。Google
              で入る場合は、Google が本サイトへ渡すアカウント情報。入口は分けていますが、認証は同じです
            </li>
            <li>
              作家登録：氏名、よみ、紹介文、工房の所在と見学案内、作品画像、SNS
              や店舗のURL
            </li>
          </ul>
          <p className="mt-4">
            ページの閲覧だけであれば、氏名や連絡先の入力は不要です。アクセス解析の仕組みは入れていません。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">利用目的</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>催しの受付、残席の管理、キャンセル、当日までの連絡</li>
            <li>作家ページの公開</li>
            <li>ログイン状態の維持</li>
            <li>申込みの確認メールなど、運営上必要な連絡</li>
          </ul>
          <p className="mt-4">
            目的の範囲を超えて使うことはありません。宣伝のための名簿にはしません。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">公開について</h2>
          <p className="mt-4">
            催しの申込み内容は公開しません。運営と、必要があれば当該催しの関係者が確認します。
          </p>
          <p className="mt-3">
            作家プロフィール、作品、工房の位置は、登録した内容がサイトへ出ます。公開したくない項目は、空欄のままにしてください。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">委託と外部サービス</h2>
          <p className="mt-4">
            法令に基づく場合を除き、本人の同意なく第三者へ提供しません。サイトの運用のため、次の事業者に処理を委託することがあります。
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Supabase（認証、データの保管、画像の保存）</li>
            <li>Resend（確認メールや運営からの連絡）</li>
            <li>Google（Google アカウントでログインする場合）</li>
          </ul>
          <p className="mt-4">
            地図は OpenFreeMap（OpenStreetMap）のタイルを表示します。タイル取得時に、通信に必要な情報が地図の提供元へ送られる場合があります。屋外催しの天気は
            Open-Meteo から、東吉野村役場付近の予報だけを取得します。個人を特定する情報は送りません。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">Cookie</h2>
          <p className="mt-4">
            作家と運営がログインした状態を保つため、Cookie
            を使います。閲覧や催しの申込みだけであれば、ログイン用の Cookie は不要です。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">保管と削除</h2>
          <p className="mt-4">
            申込みの記録は、催しの運営に必要な期間、保管します。作家アカウントの情報は、登録が続くあいだ保管します。
          </p>
          <p className="mt-3">
            開示、訂正、利用停止、削除のご請求は、下記の運営までご連絡ください。本人確認のうえ、対応します。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">改定</h2>
          <p className="mt-4">
            内容を改めるときは、このページを更新します。重要な変更がある場合は、お知らせでも知らせます。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">運営</h2>
          <p className="mt-4">
            {site.name}
            <br />
            {site.prefecture}
          </p>
          <p className="mt-3">
            お問い合わせは
            <Link href="/about" className="mx-1 underline decoration-line underline-offset-4">
              このサイトについて
            </Link>
            をご覧のうえ、運営までお願いします。
          </p>
          <p className="mt-6 text-[13px] tracking-wide">制定：2026年8月18日</p>
        </section>
      </div>
    </div>
  );
}
