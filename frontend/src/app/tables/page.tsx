"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTables, type CustomTable } from "@/lib/tablesApi";
import { NewTableForm } from "@/components/NewTableForm";
import { cardClasses } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TablesPage() {
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTables()
      .then(setTables)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link href="/" className="w-fit text-sm text-ink-muted transition-colors hover:text-ink">
        ← Back home
      </Link>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Tables</h1>
        <span className="font-mono text-xs text-ink-muted">
          {loading || failed ? "—" : `${tables.length} tables`}
        </span>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Build a table for anything that doesn&rsquo;t fit — your own columns, your own data.
      </p>

      {loading ? null : failed ? (
        <EmptyState
          tone="error"
          className="mt-10"
          title="Couldn’t reach the server."
          description="Make sure the backend is running, then refresh."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <NewTableForm />

          {tables.length > 0 && (
            <ul className={cardClasses({ padding: "none", className: "divide-y divide-line overflow-hidden" })}>
              {tables.map((table) => (
                <li key={table.id}>
                  <Link
                    href={`/tables/${table.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {table.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-ink-muted">
                      {formatUpdated(table.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
