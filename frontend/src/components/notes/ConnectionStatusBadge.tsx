import type { ConnectionStatus } from "@/hooks/useYjsEditor";

const STYLES: Record<ConnectionStatus, string> = {
  connected: "bg-sage-soft text-sage",
  connecting: "bg-clay-soft text-clay",
  reconnecting: "bg-clay-soft text-clay animate-pulse",
  offline: "bg-clay-soft text-clay",
};

const LABELS: Record<ConnectionStatus, string> = {
  connected: "connected",
  connecting: "connecting…",
  reconnecting: "reconnecting…",
  offline: "offline",
};

export function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
      title={`Connection: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
