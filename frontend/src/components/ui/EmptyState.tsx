import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { AlertIcon, InboxIcon } from "@/components/ui/Icon";

export type EmptyStateTone = "neutral" | "error";

const TONE_BADGE_CLASSES: Record<EmptyStateTone, string> = {
  neutral: "bg-sage-soft text-sage",
  error: "bg-clay-soft text-clay",
};

type EmptyStateProps = {
  tone?: EmptyStateTone;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ tone = "neutral", title, description, action, className = "" }: EmptyStateProps) {
  const Icon = tone === "error" ? AlertIcon : InboxIcon;
  return (
    <Card padding="lg" className={`flex flex-col items-center text-center ${className}`.trim()}>
      <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${TONE_BADGE_CLASSES[tone]}`}>
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </Card>
  );
}
