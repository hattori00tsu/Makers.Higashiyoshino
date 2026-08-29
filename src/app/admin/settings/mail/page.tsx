"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SettingsNav } from "@/components/admin/settings-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/account/fields";
import {
  defaultMailSettings,
  loadMailSettings,
  saveMailSettings,
  type MailSettings,
} from "@/lib/mail/settings";
import {
  defaultMailTemplates,
  defaultMailTemplatesEn,
  MAIL_TEMPLATE_GROUPS,
  MAIL_TEMPLATE_META,
  type MailCopy,
  type MailTemplateKey,
} from "@/lib/mail/templates";

function MailCopyEditor({
  copy,
  onChange,
  onReset,
}: {
  copy: MailSettings["copy"];
  onChange: (key: MailTemplateKey, patch: Partial<MailCopy>) => void;
  onReset: (key: MailTemplateKey) => void;
}) {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-serif text-xl tracking-wide">メールの文面</h2>
        <p className="mt-4 text-sm leading-7 text-sumi-soft">
          空になった差し込みは、その行が消えます。保存すると、次の送信から使います。来訪者向けのメールは、英語版サイトからの申込み・ログインでは英語の文面を使います。
        </p>
      </div>
      {MAIL_TEMPLATE_GROUPS.map((group) => (
        <div key={group.title} className="space-y-8">
          <h3 className="text-[12px] tracking-[0.14em] text-sumi-soft">{group.title}</h3>
          {group.keys.map((key) => {
            const meta = MAIL_TEMPLATE_META[key];
            const item = copy[key];
            return (
              <div key={key} className="space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-sumi">{meta.label}</p>
                  <button
                    type="button"
                    className="text-[13px] tracking-[0.14em] text-sumi-soft"
                    onClick={() => onReset(key)}
                  >
                    初期文面に戻す
                  </button>
                </div>
                <Field label="件名">
                  <TextInput
                    value={item.subject}
                    onChange={(e) => onChange(key, { subject: e.target.value })}
                  />
                </Field>
                <Field label="本文">
                  <TextArea
                    rows={9}
                    className="min-h-40"
                    value={item.text}
                    onChange={(e) => onChange(key, { text: e.target.value })}
                  />
                </Field>
                <p className="text-xs leading-6 text-sumi-soft">{meta.placeholders}</p>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

export default function AdminMailSettingsPage() {
  const { ready, user } = useAdmin();
  const localOnly = user?.source === "preview";
  const [draft, setDraft] = useState<MailSettings>(defaultMailSettings());
  const [message, setMessage] = useState("");
  const [copyLang, setCopyLang] = useState<"ja" | "en">("ja");

  useEffect(() => {
    if (!ready) return;
    loadMailSettings(localOnly).then(setDraft);
  }, [ready, localOnly]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await saveMailSettings(draft, localOnly);
      setMessage("保存しました。");
    } catch {
      setMessage("保存できませんでした。schema.sql の再実行を確認してください。");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">設定</h1>
      <AdminNav />
      <SettingsNav />

      <form className="space-y-12" onSubmit={onSave}>
        <section>
          <h2 className="font-serif text-xl tracking-wide">メール承認</h2>
          <p className="mt-4 text-sm leading-7 text-sumi-soft">
            メールにログイン用のリンクを送ります。パスワードはありません。Authentication の Email で Magic link をオンにし、Redirect URL に
            localhost、本番、Vercel のプレビュー（例: <code className="text-sumi">https://*-hattori-tsugutos-projects.vercel.app/**</code>
            ）の <code className="text-sumi">/auth/callback</code> を入れてください。SMTP に Resend
            を付けていないと、チーム以外のメールには届きません。
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="font-serif text-xl tracking-wide">運営からのメール</h2>
          <p className="text-sm leading-7 text-sumi-soft">
            申込みの受付とログイン用のリンクは Resend で送ります。<code className="text-sumi">RESEND_API_KEY</code> と{" "}
            <code className="text-sumi">RESEND_FROM</code> が無いときは保存だけします。ログインメールを下の文面で送るには、サーバーに{" "}
            <code className="text-sumi">SUPABASE_SERVICE_ROLE_KEY</code> も入れてください。無いときは Authentication の Email
            Templates が使われます。差し込みは <code className="text-sumi">{"{{eventTitle}}"}</code> のように書きます。
          </p>
          <Field label="運営の通知先">
            <TextInput
              type="email"
              value={draft.notifyEmail}
              onChange={(e) => setDraft({ ...draft, notifyEmail: e.target.value })}
              placeholder="ops@example.com"
            />
          </Field>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailAdminPending}
              onChange={(e) => setDraft({ ...draft, mailAdminPending: e.target.checked })}
            />
            <span>つくり手の登録、またはつくり手が催しを作ったとき、運営へ通知する</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailApplications}
              onChange={(e) => setDraft({ ...draft, mailApplications: e.target.checked })}
            />
            <span>催しの予約が確定したとき、来訪者へ確認メールを送る</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailArtistApplications}
              onChange={(e) => setDraft({ ...draft, mailArtistApplications: e.target.checked })}
            />
            <span>催しの申込みがあったとき、参加つくり手へ通知メールを送る</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-7 text-sumi-soft">
            <input
              type="checkbox"
              className="mt-1.5"
              checked={draft.mailArtistDecision}
              onChange={(e) => setDraft({ ...draft, mailArtistDecision: e.target.checked })}
            />
            <span>つくり手を公開または非公開にしたとき、本人へメールを送る</span>
          </label>
        </section>

        <div className="flex gap-4 text-[13px] tracking-[0.16em]">
          <button
            type="button"
            className={copyLang === "ja" ? "text-sumi" : "text-sumi-soft"}
            onClick={() => setCopyLang("ja")}
          >
            日本語
          </button>
          <button
            type="button"
            className={copyLang === "en" ? "text-sumi" : "text-sumi-soft"}
            onClick={() => setCopyLang("en")}
          >
            English
          </button>
        </div>
        <MailCopyEditor
          copy={copyLang === "en" ? draft.copyEn : draft.copy}
          onChange={(key, patch) =>
            setDraft((current) => {
              const bucket = copyLang === "en" ? "copyEn" : "copy";
              return {
                ...current,
                [bucket]: { ...current[bucket], [key]: { ...current[bucket][key], ...patch } },
              };
            })
          }
          onReset={(key) =>
            setDraft((current) => {
              const bucket = copyLang === "en" ? "copyEn" : "copy";
              const defaults = copyLang === "en" ? defaultMailTemplatesEn() : defaultMailTemplates();
              return {
                ...current,
                [bucket]: { ...current[bucket], [key]: defaults[key] },
              };
            })
          }
        />

        <PrimaryButton type="submit">保存する</PrimaryButton>
        {message ? <p className="text-sm text-sumi-soft">{message}</p> : null}
      </form>
    </div>
  );
}
