import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export type InputSize = "xs" | "sm" | "md";
export type InputTone = "paper" | "surface";

const SIZE_CLASSES: Record<InputSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

const TONE_CLASSES: Record<InputTone, string> = {
  paper: "bg-paper",
  surface: "bg-surface",
};

export function inputClasses(
  size: InputSize = "sm",
  tone: InputTone = "paper",
  className = "",
) {
  return `rounded-control border border-line text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-clay focus:ring-1 focus:ring-clay ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`.trim();
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  tone?: InputTone;
};

export function Input({ size, tone, className = "", ...props }: InputProps) {
  return <input {...props} className={inputClasses(size, tone, className)} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: InputSize;
  tone?: InputTone;
};

export function Textarea({ size, tone, className = "", ...props }: TextareaProps) {
  return <textarea {...props} className={inputClasses(size, tone, className)} />;
}
