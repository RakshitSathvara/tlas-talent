"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-surface hover:opacity-90",
  secondary: "border border-line bg-transparent text-ink hover:border-line-strong",
  accent: "bg-accent text-surface hover:opacity-90",
  ghost: "bg-transparent text-ink-soft hover:bg-black/[0.04]",
};

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type LinkProps = CommonProps & {
  href: string;
};

/** Pill CTA in three styles (design-system.md §5.2). Renders a Link when `href` is set. */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", className, children } = props;
  const classes = cn(base, variants[variant], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, className: _c, children: _ch, ...rest } = props as ButtonProps;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
