import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "subtle" | "subtle-active";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-clay text-surface hover:bg-clay/90",
  outline: "border border-line text-ink hover:bg-clay-soft/40",
  ghost: "text-ink-muted hover:text-ink",
  subtle: "bg-clay-soft/60 text-clay hover:bg-clay-soft",
  "subtle-active": "bg-sage-soft text-sage",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "px-3 py-1 text-xs",
  sm: "px-4 py-1.5 text-xs",
  md: "px-4 py-1.5 text-sm",
  lg: "px-4 py-2.5 text-sm",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  return `rounded-pill font-medium transition-[background-color,color,transform] cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className = "", ...props }: ButtonProps) {
  return <button type="button" {...props} className={buttonClasses(variant, size, className)} />;
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({ variant, size, className = "", href, children, ...props }: LinkButtonProps) {
  return (
    <Link href={href} {...props} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

export type IconButtonTone = "muted" | "danger";

const ICON_TONE_CLASSES: Record<IconButtonTone, string> = {
  muted: "text-ink-muted hover:text-ink",
  danger: "text-ink-muted hover:text-clay",
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: IconButtonTone };

export function IconButton({ tone = "muted", className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`transition-[color,transform] cursor-pointer active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${ICON_TONE_CLASSES[tone]} ${className}`.trim()}
    />
  );
}
