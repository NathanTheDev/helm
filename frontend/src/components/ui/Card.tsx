import type { FormHTMLAttributes, HTMLAttributes } from "react";

export type CardVariant = "default" | "form" | "dashed";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardShadow = "none" | "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "border-line bg-surface",
  form: "border-clay bg-surface",
  dashed: "border-dashed border-line bg-transparent",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-8",
};

const SHADOW_CLASSES: Record<CardShadow, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export type CardOptions = {
  variant?: CardVariant;
  padding?: CardPadding;
  shadow?: CardShadow;
  interactive?: boolean;
  className?: string;
};

export function cardClasses({
  variant = "default",
  padding = "md",
  shadow = "sm",
  interactive = false,
  className = "",
}: CardOptions = {}) {
  const lift = interactive
    ? "transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
    : "";
  return `rounded-card border ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${SHADOW_CLASSES[shadow]} ${lift} ${className}`.trim();
}

type CardProps = HTMLAttributes<HTMLDivElement> & CardOptions;

export function Card({ variant, padding, shadow, interactive, className, ...props }: CardProps) {
  return <div {...props} className={cardClasses({ variant, padding, shadow, interactive, className })} />;
}

type CardFormProps = FormHTMLAttributes<HTMLFormElement> & CardOptions;

export function CardForm({
  variant = "form",
  padding,
  shadow,
  interactive,
  className,
  ...props
}: CardFormProps) {
  return <form {...props} className={cardClasses({ variant, padding, shadow, interactive, className })} />;
}
