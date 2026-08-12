import { cardClasses } from "@/components/ui/Card";

export function VaultConnectionSkeleton() {
  return (
    <div className={cardClasses({ padding: "none", className: "mt-6 h-[220px] animate-pulse" })} />
  );
}

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← Back to Brain</span>

      <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">Vault connection</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Connect helm to your Obsidian vault via the &quot;Local REST API&quot; plugin&apos;s
        MCP server, reached over a private tunnel (e.g. Tailscale) you control.
      </p>

      <VaultConnectionSkeleton />
    </main>
  );
}
