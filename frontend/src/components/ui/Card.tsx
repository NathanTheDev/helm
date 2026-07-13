import type { FormHTMLAttributes, HTMLAttributes } from "react";

export type CardVariant = "default" | "form" | "dashed";
export type CardPadding = "none" | "sm" | "md" | "lg";

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

export function cardClasses(
  variant: CardVariant = "default",
  padding: CardPadding = "md",
  className = "",
) {
  return `rounded-card border ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`.trim();
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function Card({ variant, padding, className = "", ...props }: CardProps) {
  return <div {...props} className={cardClasses(variant, padding, className)} />;
}

type CardFormProps = FormHTMLAttributes<HTMLFormElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function CardForm({ variant = "form", padding, className = "", ...props }: CardFormProps) {
  return <form {...props} className={cardClasses(variant, padding, className)} />;
}
