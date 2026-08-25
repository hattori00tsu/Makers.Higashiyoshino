import { site } from "@/data/site";

export type MailCopy = {
  subject: string;
  text: string;
};

export const MAIL_TEMPLATE_KEYS = [
  "signInLink",
  "reservationConfirmed",
  "reservationArtist",
  "cancelConfirmed",
  "cancelArtist",
  "artistApproved",
  "artistRejected",
  "artistPending",
  "eventPending",
] as const;

export type MailTemplateKey = (typeof MAIL_TEMPLATE_KEYS)[number];
export type MailTemplates = Record<MailTemplateKey, MailCopy>;

export type ReservationMailVars = {
  eventTitle: string;
  visitorName: string;
  visitorEmail: string;
  artistName?: string;
  phone?: string;
  partySize?: number;
  note?: string;
  reason?: string;
  sessionLabel?: string;
  origin: string;
  eventSlug?: string;
};

export const MAIL_TEMPLATE_GROUPS: { title: string; keys: MailTemplateKey[] }[] = [
  {
    title: "ログイン",
    keys: ["signInLink"],
  },
  {
    title: "予約",
    keys: ["reservationConfirmed", "reservationArtist"],
  },
  {
    title: "キャンセル",
    keys: ["cancelConfirmed", "cancelArtist"],
  },
  {
    title: "作家登録",
    keys: ["artistApproved", "artistRejected", "artistPending", "eventPending"],
  },
];

export const MAIL_TEMPLATE_META: Record<MailTemplateKey, { label: string; placeholders: string }> = {
  signInLink: {
    label: "メールで入るとき",
    placeholders: "{{signInUrl}} {{email}} {{siteName}} {{siteShortName}}",
  },
  reservationConfirmed: {
    label: "来訪者への確定",
    placeholders: "{{visitorName}} {{eventTitle}} {{session}} {{party}} {{visitUrl}} {{siteName}} {{siteShortName}}",
  },
  reservationArtist: {
    label: "参加つくり手への通知",
    placeholders:
      "{{artistName}} {{eventTitle}} {{visitorName}} {{visitorEmail}} {{phone}} {{session}} {{party}} {{note}} {{listUrl}}",
  },
  cancelConfirmed: {
    label: "来訪者への受付",
    placeholders: "{{visitorName}} {{eventTitle}} {{session}} {{party}} {{siteName}} {{siteShortName}}",
  },
  cancelArtist: {
    label: "参加つくり手への通知",
    placeholders: "{{artistName}} {{eventTitle}} {{visitorName}} {{visitorEmail}} {{session}} {{party}} {{reason}} {{listUrl}}",
  },
  artistApproved: {
    label: "承認したとき",
    placeholders: "{{visitorName}} {{mypageUrl}} {{siteName}} {{siteShortName}}",
  },
  artistRejected: {
    label: "見送ったとき",
    placeholders: "{{visitorName}} {{registerUrl}} {{siteShortName}}",
  },
  artistPending: {
    label: "つくり手が登録したとき（運営）",
    placeholders: "{{visitorName}} {{artistsUrl}} {{siteShortName}}",
  },
  eventPending: {
    label: "つくり手が催しを作ったとき（運営）",
    placeholders: "{{visitorName}} {{eventTitle}} {{eventAdminUrl}} {{siteShortName}}",
  },
};

export function defaultMailTemplates(): MailTemplates {
  const prefix = `【{{siteShortName}}】`;
  return {
    signInLink: {
      subject: `${prefix}ログイン用のリンク`,
      text: `ログイン用のリンクをお送りします。下のリンクを開くと、このサイトに入れます。パスワードはありません。\n\n{{signInUrl}}\n\nこのリンクは短い時間で無効になり、一度しか使えません。覚えのない場合は、このメールを無視してください。\n{{siteName}}\n`,
    },
    reservationConfirmed: {
      subject: `${prefix}{{eventTitle}}の予約が確定しました`,
      text: `{{visitorName}} さま\n\n{{eventTitle}}の予約が確定しました。\n{{session}}\n{{party}}\n\n予約の確認とキャンセルは、次のページから行えます。\n{{visitUrl}}\n\n当日まで、このメールを控えておいてください。\n{{siteName}}\n`,
    },
    reservationArtist: {
      subject: `${prefix}{{eventTitle}}に申込みがありました`,
      text: `{{artistName}} さま\n\n{{eventTitle}}に参加の申込みがありました。\n\nお名前：{{visitorName}}\nメール：{{visitorEmail}}\n{{phone}}\n{{session}}\n{{party}}\n{{note}}\n\n予約者の一覧：\n{{listUrl}}\n`,
    },
    cancelConfirmed: {
      subject: `${prefix}{{eventTitle}}のキャンセルを受け付けました`,
      text: `{{visitorName}} さま\n\n{{eventTitle}}のキャンセルを受け付けました。\n{{session}}\n{{party}}\n\n{{siteName}}\n`,
    },
    cancelArtist: {
      subject: `${prefix}{{eventTitle}}にキャンセルがありました`,
      text: `{{artistName}} さま\n\n{{eventTitle}}の予約がキャンセルされました。\n\nお名前：{{visitorName}}\nメール：{{visitorEmail}}\n{{session}}\n{{party}}\n{{reason}}\n\n予約者の一覧：\n{{listUrl}}\n`,
    },
    artistApproved: {
      subject: `${prefix}つくり手登録を承認しました`,
      text: `{{visitorName}} さま\n\n{{siteName}}のつくり手登録を承認しました。マイページからプロフィールと作品を整えられます。\n{{mypageUrl}}\n`,
    },
    artistRejected: {
      subject: `${prefix}つくり手登録の申請について`,
      text: `{{visitorName}} さま\n\n今回の申請は見送らせていただきました。内容を直して、再度お申し込みください。\n{{registerUrl}}\n`,
    },
    artistPending: {
      subject: `${prefix}つくり手が登録しました（{{visitorName}}）`,
      text: `{{visitorName}} さんからつくり手登録がありました。いまは非公開です。公開はつくり手の一覧から行えます。\n{{artistsUrl}}\n`,
    },
    eventPending: {
      subject: `${prefix}催しの登録がありました（{{eventTitle}}）`,
      text: `{{visitorName}} さんが個別の催しを登録しました。公開待ちです。\n\n催し：{{eventTitle}}\n{{eventAdminUrl}}\n`,
    },
  };
}

export function mergeMailTemplates(raw?: unknown): MailTemplates {
  const defaults = defaultMailTemplates();
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return defaults;
    }
  }
  if (!value || typeof value !== "object") return defaults;
  const input = value as Record<string, Partial<MailCopy> | undefined>;
  const next = { ...defaults };
  for (const key of MAIL_TEMPLATE_KEYS) {
    const item = input[key];
    if (!item) continue;
    next[key] = {
      subject: item.subject?.trim() ? item.subject : defaults[key].subject,
      text: item.text?.trim() ? item.text : defaults[key].text,
    };
    if (key === "cancelArtist" && !next[key].text.includes("{{reason}}")) {
      next[key] = { ...next[key], text: `${next[key].text.trimEnd()}\n{{reason}}\n` };
    }
    if (key === "signInLink" && !next[key].text.includes("{{signInUrl}}")) {
      next[key] = { ...next[key], text: `${next[key].text.trimEnd()}\n\n{{signInUrl}}\n` };
    }
  }
  return next;
}

export function fillTemplate(source: string, vars: Record<string, string>) {
  const lines = source.split("\n").flatMap((line) => {
    const placeholdersOnly = /^\s*(\{\{\w+\}\}|\s)*$/.test(line) && /\{\{/.test(line);
    const filled = line.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
    if (placeholdersOnly && !filled.trim()) return [];
    return [filled];
  });
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

export function renderMail(templates: MailTemplates, key: MailTemplateKey, vars: Record<string, string>): MailCopy {
  const copy = templates[key] ?? defaultMailTemplates()[key];
  return {
    subject: fillTemplate(copy.subject, vars).trim(),
    text: fillTemplate(copy.text, vars),
  };
}

export function reservationMailVars(input: ReservationMailVars): Record<string, string> {
  return {
    eventTitle: input.eventTitle,
    visitorName: input.visitorName,
    visitorEmail: input.visitorEmail,
    artistName: input.artistName?.trim() || "つくり手",
    session: input.sessionLabel?.trim() ? `日程：${input.sessionLabel.trim()}` : "",
    party: input.partySize ? `人数：${input.partySize}名` : "",
    phone: input.phone?.trim() ? `電話：${input.phone.trim()}` : "",
    note: input.note?.trim() ? `連絡事項：${input.note.trim()}` : "",
    reason: input.reason?.trim() ? `キャンセル理由：${input.reason.trim()}` : "",
    listUrl: `${input.origin}/mypage/applications`,
    mypageUrl: `${input.origin}/mypage`,
    visitUrl: `${input.origin}/visit`,
    registerUrl: `${input.origin}/register`,
    adminUrl: `${input.origin}/admin`,
    artistsUrl: `${input.origin}/admin/artists`,
    eventAdminUrl: input.eventSlug
      ? `${input.origin}/admin/events/${input.eventSlug}`
      : `${input.origin}/admin/events`,
    siteName: site.name,
    siteShortName: site.shortName,
  };
}

export function artistMailVars(
  name: string,
  origin: string,
  extra?: { eventTitle?: string; eventSlug?: string },
): Record<string, string> {
  return reservationMailVars({
    eventTitle: extra?.eventTitle ?? "",
    visitorName: name,
    visitorEmail: "",
    origin,
    eventSlug: extra?.eventSlug,
  });
}

export function signInMailVars(input: { email: string; signInUrl: string }): Record<string, string> {
  return {
    email: input.email,
    signInUrl: input.signInUrl,
    siteName: site.name,
    siteShortName: site.shortName,
  };
}
