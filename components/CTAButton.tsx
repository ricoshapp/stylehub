import Link from "next/link";
import React from "react";

type Props = {
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

function mergeClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function CTAButton({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400/60 focus:ring-offset-zinc-900";
  const theme =
    variant === "primary"
      ? "bg-emerald-500 text-white hover:bg-emerald-400"
      : "bg-transparent border border-slate-700 text-slate-200 hover:bg-white/5";
  const cls = mergeClasses(base, theme, className);

  if (href) {
    return (
      <Link href={href} className={cls} {...(rest as any)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as any)}>
      {children}
    </button>
  );
}
