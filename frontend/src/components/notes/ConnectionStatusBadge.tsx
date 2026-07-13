import type { ConnectionStatus } from "@/hooks/useYjsEditor";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const TONES: Record<ConnectionStatus, BadgeTone> = {
  connected: "success",
  connecting: "accent",
  reconnecting: "accent",
  offline: "accent",
};

const LABELS: Record<ConnectionStatus, string> = {
  connected: "connected",
  connecting: "connecting…",
  reconnecting: "reconnecting…",
  offline: "offline",
};

export function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <Badge tone={TONES[status]} pulse={status === "reconnecting"} title={`Connection: ${LABELS[status]}`}>
      {LABELS[status]}
    </Badge>
  );
}
