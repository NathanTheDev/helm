import type { HTMLAttributes } from "react";

export type BadgeTone = "neutral" | "accent" | "success";
export type BadgeSize = "xs" | "sm";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-paper text-ink-muted",
  accent: "bg-clay-soft text-clay",
  success: "bg-sage-soft text-sage",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-0.5 text-xs",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
  pulse?: boolean;
};

export function Badge({
  tone = "neutral",
  size = "sm",
  pulse = false,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`rounded-pill font-mono font-medium ${pulse ? "animate-pulse" : ""} ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`.trim()}
    />
  );
}
