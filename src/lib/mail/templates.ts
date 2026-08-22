import { site } from "@/data/site";

export type MailCopy = {
  subject: string;
  text: string;
};

export const MAIL_TEMPLATE_KEYS = [
  "reservationConfirmed",
  "reservationArtist",
  "cancelConfirmed",
  "cancelArtist",
  "artistApproved",
  "artistRejected",
  "artistPending",
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
  sessionLabel?: string;
  origin: string;
};

export const MAIL_TEMPLATE_GROUPS: { title: string; keys: MailTemplateKey[] }[] = [
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
    keys: ["artistApproved", "artistRejected", "artistPending"],
  },
];

export const MAIL_TEMPLATE_META: Record<MailTemplateKey, { label: string; placeholders: string }> = {
  reservationConfirmed: {
    label: "来訪者への確定",
    placeholders: "{{visitorName}} {{eventTitle}} {{session}} {{party}} {{siteName}} {{siteShortName}}",
  },
  reservationArtist: {
    label: "参加作家への通知",
    placeholders:
      "{{artistName}} {{eventTitle}} {{visitorName}} {{visitorEmail}} {{phone}} {{session}} {{party}} {{note}} {{listUrl}}",
  },
  cancelConfirmed: {
    label: "来訪者への受付",
    placeholders: "{{visitorName}} {{eventTitle}} {{session}} {{party}} {{siteName}} {{siteShortName}}",
  },
  cancelArtist: {
    label: "参加作家への通知",
    placeholders: "{{artistName}} {{eventTitle}} {{visitorName}} {{visitorEmail}} {{session}} {{party}} {{listUrl}}",
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
    label: "申請が届いたとき（運営）",
    placeholders: "{{visitorName}} {{adminUrl}} {{siteShortName}}",
  },
};

export function defaultMailTemplates(): MailTemplates {
  const prefix = `【{{siteShortName}}】`;
  return {
    reservationConfirmed: {
      subject: `${prefix}{{eventTitle}}の予約が確定しました`,
      text: `{{visitorName}} さま\n\n{{eventTitle}}の予約が確定しました。\n{{session}}\n{{party}}\n\n当日まで、このメールを控えておいてください。\n{{siteName}}\n`,
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
      text: `{{artistName}} さま\n\n{{eventTitle}}の予約がキャンセルされました。\n\nお名前：{{visitorName}}\nメール：{{visitorEmail}}\n{{session}}\n{{party}}\n\n予約者の一覧：\n{{listUrl}}\n`,
    },
    artistApproved: {
      subject: `${prefix}作家登録を承認しました`,
      text: `{{visitorName}} さま\n\n{{siteName}}の作家登録を承認しました。マイページからプロフィールと作品を整えられます。\n{{mypageUrl}}\n`,
    },
    artistRejected: {
      subject: `${prefix}作家登録の申請について`,
      text: `{{visitorName}} さま\n\n今回の申請は見送らせていただきました。内容を直して、再度お申し込みください。\n{{registerUrl}}\n`,
    },
    artistPending: {
      subject: `${prefix}作家の申請が届きました（{{visitorName}}）`,
      text: `{{visitorName}} さんから作家登録の申請が届きました。\n{{adminUrl}}\n`,
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
    artistName: input.artistName?.trim() || "作家",
    session: input.sessionLabel?.trim() ? `日程：${input.sessionLabel.trim()}` : "",
    party: input.partySize ? `人数：${input.partySize}名` : "",
    phone: input.phone?.trim() ? `電話：${input.phone.trim()}` : "",
    note: input.note?.trim() ? `連絡事項：${input.note.trim()}` : "",
    listUrl: `${input.origin}/mypage/applications`,
    mypageUrl: `${input.origin}/mypage`,
    registerUrl: `${input.origin}/register`,
    adminUrl: `${input.origin}/admin`,
    siteName: site.name,
    siteShortName: site.shortName,
  };
}

export function artistMailVars(name: string, origin: string): Record<string, string> {
  return reservationMailVars({
    eventTitle: "",
    visitorName: name,
    visitorEmail: "",
    origin,
  });
}
