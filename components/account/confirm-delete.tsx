"use client";

import { useState } from "react";

type Props = {
  label?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  message?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDelete({
  label = "削除する",
  confirmLabel = "削除する",
  cancelLabel = "やめる",
  message = "この催しを削除します。取り消せません。",
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className="mt-10 text-[13px] tracking-[0.14em] text-sumi-soft"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="mt-10 space-y-3">
      <p className="text-sm leading-7 text-sumi-soft">{message}</p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center border border-line px-5 py-2.5 text-[13px] tracking-[0.16em] text-sumi disabled:opacity-50"
          disabled={busy}
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            try {
              await onConfirm();
            } catch {
              setBusy(false);
            }
          }}
        >
          {busy ? "削除しています" : confirmLabel}
        </button>
        <button
          type="button"
          className="text-[13px] tracking-[0.14em] text-sumi-soft disabled:opacity-50"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
