"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";

export default function AdminManualPage() {
  const { ready } = useAdmin();
  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">使い方</h1>
      <AdminNav />

      <div className="space-y-12 text-sm leading-7 text-sumi-soft">
        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">はじめる</h2>
          <p className="mt-4">
            来訪者は催しの閲覧だけならログインしません。申込みと予約の確認は、来訪者の入口から入ります。作家と運営の入口は分けています。どれも Google、またはメールに届くリンクで入ります。パスワードはありません。同じアカウントに運営権限と作家登録の両方を付けられます。
          </p>
          <p className="mt-3">
            来訪者は <Link href="/login" className="underline decoration-line underline-offset-4">入る</Link>、作家は
            <Link href="/register" className="mx-1 underline decoration-line underline-offset-4">つくり手として入る</Link>
            、運営は
            <Link href="/admin/login" className="mx-1 underline decoration-line underline-offset-4">運営として入る</Link>
            から入ります。Google やメールをつないだあとの催し・お知らせ・周辺・申込みはサーバーに残ります。まだつないでないときは、それぞれの画面のプレビューで確認できます。プレビューの内容は、このブラウザにだけ残ります。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">作家登録</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>
              作家は
              <Link href="/register" className="mx-1 underline decoration-line underline-offset-4">
                つくり手の入口
              </Link>
              から入り、未登録なら作家登録をします。運営アカウントでも、同じ手順で作家登録できます。確認待ちはありません。
            </li>
            <li>
              登録後、作家はマイページでプロフィール、作品、個別の催しを直せます。運営は
              <Link href="/admin/artists" className="mx-1 underline decoration-line underline-offset-4">
                作家
              </Link>
              から一覧し、公開ページの内容と公開／非公開を直せます。作家の追加もここからできます。アカウントがなくても公開ページ用に足せます。参加する催しは、催しの編集で作家を紐付けたときに出ます。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">催しを出す</h2>
          <p className="mt-4">
            運営は <Link href="/admin/events" className="underline decoration-line underline-offset-4">催し</Link> から作ります。総合開催と会場は運営だけが作ります。催しの種別・作家のカテゴリー・シリーズ・会場・駐車場は
            <Link href="/admin/options" className="mx-1 underline decoration-line underline-offset-4">項目</Link>
            で増やします。シリーズは毎年続く開催につけ、年号は入れません。同じシリーズの過去回は、各ページの下に出ます。会場と駐車場は総合開催と会場で選び、個別の催しは所属する会場の案内を使います。
          </p>
          <p className="mt-3">
            総合開催は日付だけの枠で、カレンダーに出ます。会場は総合開催がなくても公開でき、下に置くこともできます。会場の日程は、個別の催しと同じ時刻つきの枠と、総合開催と同じ終日枠の両方を入れられます。個別の催しは、総合開催または会場の編集ページから入れます。詳細な日程ごとに、予約がいるときは参加可能人数を付けられます。
          </p>
          <p className="mt-3">
            作家はマイページの
            <Link href="/mypage/events" className="mx-1 underline decoration-line underline-offset-4">催し</Link>
            から個別の催しを作れます。公開状態と、総合開催・会場への所属は作家側では扱えません。運営が所属先のページへ入れ、公開を承認すると、トップ・催し一覧・地図に載ります。終了した総合開催と会場は
            <Link href="/archive" className="mx-1 underline decoration-line underline-offset-4">アーカイブ</Link>
            へ移ります。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">申込み</h2>
          <p className="mt-4">
            来訪者はログインしたうえで、名前・人数を入れて送ります。残席がなくなると受付がしまります。予約の一覧とキャンセル申請は、来訪者ページ（<Link href="/mypage" className="underline decoration-line underline-offset-4">/mypage</Link>）から行えます。
          </p>
          <p className="mt-3">
            申込みが届いた時点で予約が確定します。内容は運営の <Link href="/admin/applications" className="underline decoration-line underline-offset-4">申込み</Link> と、作家の
            <Link href="/mypage/applications" className="mx-1 underline decoration-line underline-offset-4">申込み</Link>
            で確認できます。予約が入ると、参加作家へ通知メールを送ります。定員はサーバー側でも見て、残席を超える申込みは受け付けません。確認メールは任意です。サーバーの環境変数に <code className="text-sumi">RESEND_API_KEY</code> と <code className="text-sumi">RESEND_FROM</code> があれば送り、なければ保存だけします。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">トップページ</h2>
          <p className="mt-4">
            直近の催しとむらの作家の並びは、
            <Link href="/admin/settings" className="mx-1 underline decoration-line underline-offset-4">
              設定
            </Link>
            で変えられます。直近の催しは、開催中があれば開催中を、なければ開催予定を出し、並びは毎回ランダムです。指定した順にも切り替えられます。催しの一覧は開催中・開催予定に分かれ、過去の総合開催と会場はアーカイブです。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">お知らせと周辺</h2>
          <p className="mt-4">
            <Link href="/admin/news" className="underline decoration-line underline-offset-4">お知らせ</Link> は公開サイトの「お知らせ」に出ます。
            <Link href="/admin/spots" className="underline decoration-line underline-offset-4">周辺</Link> は案内ページと地図のピンになります。種別は周辺ページで増やせます。案内は短く書いてください。村は便が悪いので、アクセス文は催し側にも残します。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-wide text-sumi">本番の前に</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              Supabase で <code className="text-sumi">supabase/schema.sql</code> を実行し、Authentication の Google と Email（Magic link）を有効にします。Redirect URL に <code className="text-sumi">/auth/callback</code> を入れます。メールの出し分けは <Link href="/admin/settings" className="underline decoration-line underline-offset-4">設定</Link> で変更できます。
            </li>
            <li>
              <code className="text-sumi">.env.example</code> を <code className="text-sumi">.env.local</code> にコピーし、Supabase の URL と anon key を入れます。
            </li>
            <li>写真は仮のストックです。東吉野の実写へ差し替えてください。</li>
            <li>屋外の催しは、開催が近い日だけ Open-Meteo の村役場付近の予報を添えます。設定は不要です。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
