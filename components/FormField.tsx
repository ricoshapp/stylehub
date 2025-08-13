// components/FormField.tsx
import React from "react";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  /** label style vibe */
  labelTone?: "default" | "muted" | "accent";
  children: React.ReactNode;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function FormField({
  label,
  hint,
  error,
  className,
  disabled = false,
  labelTone = "default",
  children,
}: Props) {
  const tone =
    labelTone === "accent"
      ? "text-slate-100"
      : labelTone === "muted"
      ? "text-slate-400"
      : "text-slate-200";

  return (
    <div className={cx(className, disabled && "opacity-60")}>
      <label className={cx("mb-1 block text-[11px] font-semibold uppercase tracking-wide", tone, disabled && "text-slate-500")}>
        {label}
      </label>
      {children}
      <div className="mt-1 min-h-[18px]">
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
