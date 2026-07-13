import type { SelectHTMLAttributes } from "react";

export type SelectSize = "xs" | "sm" | "md";
export type SelectTone = "paper" | "surface";

const SIZE_CLASSES: Record<SelectSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

const TONE_CLASSES: Record<SelectTone, string> = {
  paper: "bg-paper",
  surface: "bg-surface",
};

export function selectClasses(
  size: SelectSize = "sm",
  tone: SelectTone = "paper",
  className = "",
) {
  return `rounded-control border border-line text-ink outline-none transition-colors focus:border-clay focus:ring-1 focus:ring-clay ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`.trim();
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: SelectSize;
  tone?: SelectTone;
};

export function Select({ size, tone, className = "", ...props }: SelectProps) {
  return <select {...props} className={selectClasses(size, tone, className)} />;
}
