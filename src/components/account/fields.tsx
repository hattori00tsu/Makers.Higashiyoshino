import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from "react";

const fieldClass =
  "w-full border border-line bg-kami px-3 py-2.5 text-sm text-sumi outline-none focus:border-sugi";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block space-y-2">
      <p className="text-[12px] tracking-[0.14em] text-sumi-soft">{label}</p>
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} min-h-28 ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function CompactSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-w-0 border border-line bg-kami px-2 py-2.5 text-sm text-sumi outline-none focus:border-sugi ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center border border-sumi bg-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] text-kami disabled:opacity-50"
    >
      {children}
    </button>
  );
}
