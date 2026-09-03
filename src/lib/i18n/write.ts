const i18nColumnPattern =
  /i18n_enabled|title_en|summary_en|description_en|access_en|price_en|name_en|area_en|bio_en|profile_en|studio_visit_en/;

export function isI18nColumnError(error?: { message?: string; details?: string; hint?: string } | null) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
  return i18nColumnPattern.test(text);
}

export function omitI18nColumns<T extends Record<string, unknown>>(row: T) {
  const next = { ...row };
  for (const key of Object.keys(next)) {
    if (i18nColumnPattern.test(key)) delete next[key];
  }
  return next;
}

/** 英語を公開しない・フォームに英訳が無いときは、既存の英訳カラムを触らない */
export function i18nWriteColumns(enabled: boolean, columns: Record<string, string | undefined>) {
  const trimmed = Object.fromEntries(
    Object.entries(columns).map(([key, value]) => [key, String(value ?? "").trim()]),
  );
  const hasCopy = Object.values(trimmed).some(Boolean);
  if (!enabled && !hasCopy) return {} as Record<string, boolean | string | null>;
  return {
    i18n_enabled: enabled,
    ...Object.fromEntries(Object.entries(trimmed).map(([key, value]) => [key, value || null])),
  } as Record<string, boolean | string | null>;
}

