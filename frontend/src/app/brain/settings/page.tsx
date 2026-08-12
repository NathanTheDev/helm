"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardForm } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  disconnectObsidian,
  getObsidianConnectionStatus,
  saveObsidianConnection,
  testObsidianConnection,
  type ObsidianConnectionStatus,
} from "@/lib/obsidianApi";
import { VaultConnectionSkeleton } from "./loading";

const STATUS_LABEL: Record<ObsidianConnectionStatus["status"], string> = {
  CONNECTED: "Connected",
  ERROR: "Unreachable",
  UNVERIFIED: "Not verified",
};

const STATUS_TONE: Record<ObsidianConnectionStatus["status"], BadgeTone> = {
  CONNECTED: "success",
  ERROR: "accent",
  UNVERIFIED: "neutral",
};

export default function BrainSettingsPage() {
  const [status, setStatus] = useState<ObsidianConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getObsidianConnectionStatus()
      .then((s) => {
        setStatus(s);
        if (s.baseUrl) setBaseUrl(s.baseUrl);
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!baseUrl.trim() || !apiKey.trim()) {
      setFormError("Base URL and API key are both required.");
      return;
    }

    setSaving(true);
    try {
      const next = await saveObsidianConnection({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() });
      setStatus(next);
      setApiKey("");
    } catch {
      setFormError("Couldn't reach the server to save this connection. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      setStatus(await testObsidianConnection());
    } catch {
      setFormError("Couldn't reach the server to test this connection. Try again.");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    await disconnectObsidian();
    setStatus({ connected: false, baseUrl: null, status: "UNVERIFIED", lastError: null, lastCheckedAt: null });
    setBaseUrl("");
    setApiKey("");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link href="/brain" className="w-fit text-sm text-ink-muted transition-colors hover:text-ink">
        ← Back to Brain
      </Link>

      <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">Vault connection</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Connect helm to your Obsidian vault via the &quot;Local REST API&quot; plugin&apos;s
        MCP server, reached over a private tunnel (e.g. Tailscale) you control.
      </p>

      {loading ? (
        <VaultConnectionSkeleton />
      ) : loadFailed ? (
        <EmptyState
          tone="error"
          className="mt-10"
          title="Couldn't reach the server."
          description="Make sure the backend is running, then refresh."
        />
      ) : (
        <>
          {status && status.baseUrl && (
            <Card className="mt-8 flex items-center justify-between" padding="md">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[status.status]}>{STATUS_LABEL[status.status]}</Badge>
                  <span className="font-mono text-xs text-ink-muted">{status.baseUrl}</span>
                </div>
                {status.status === "ERROR" && status.lastError && (
                  <p className="mt-2 text-sm text-clay-text">{status.lastError}</p>
                )}
                {status.lastCheckedAt && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Last checked {new Date(status.lastCheckedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
                  {testing ? "Testing…" : "Test connection"}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </Card>
          )}

          <CardForm onSubmit={handleSave} className="mt-6 flex flex-col gap-4" padding="lg">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Base URL
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:27124 or your tailnet address"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              API key
              <Input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="From the Local REST API plugin's settings"
              />
            </label>

            {formError && <p className="text-sm text-clay-text">{formError}</p>}

            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving…" : "Save & test connection"}
            </Button>
          </CardForm>
        </>
      )}
    </main>
  );
}
