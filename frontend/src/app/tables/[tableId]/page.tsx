"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getTable,
  deleteTable,
  deleteField,
  type CustomTableWithFields,
  type CustomField,
} from "@/lib/tablesApi";
import { TableGrid } from "@/components/TableGrid";
import { FieldForm } from "@/components/FieldForm";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrashIcon } from "@/components/ui/Icon";

export default function TableDetailPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();

  const [table, setTable] = useState<CustomTableWithFields | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingField, setAddingField] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Resets loading/error state when navigating between tables (same page
    // component instance, different tableId).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFailed(false);

    getTable(tableId)
      .then((loaded) => {
        if (!cancelled) setTable(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tableId]);

  const refresh = () => {
    getTable(tableId)
      .then(setTable)
      .catch(() => setFailed(true));
  };

  const removeTable = () => {
    if (!table) return;
    if (!confirm(`Delete "${table.name}"? This can't be undone.`)) return;
    deleteTable(table.id)
      .then(() => router.push("/tables"))
      .catch(() => {});
  };

  const removeField = (field: CustomField) => {
    if (!confirm(`Delete field "${field.name}"? Existing row data for it will be dropped.`)) return;
    deleteField(field.id)
      .then(refresh)
      .catch(() => {});
  };

  const closeFieldForm = () => {
    setAddingField(false);
    setEditingField(null);
  };

  if (loading) return null;

  if (failed || !table) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <Link href="/tables" className="w-fit text-sm text-ink-muted transition-colors hover:text-ink">
          ← All tables
        </Link>
        <EmptyState
          tone="error"
          className="mt-10"
          title="Couldn’t load this table."
          description="It may not exist, or the backend is unreachable."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link href="/tables" className="w-fit text-sm text-ink-muted transition-colors hover:text-ink">
        ← All tables
      </Link>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate font-display text-3xl text-ink sm:text-4xl">{table.name}</h1>
        <IconButton tone="danger" onClick={removeTable} aria-label="Delete table">
          <TrashIcon />
        </IconButton>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {table.fields.length === 0 && !addingField ? (
          <EmptyState
            title="No fields yet."
            description="Add your first field to start shaping this table."
            action={
              <Button size="sm" onClick={() => setAddingField(true)}>
                + Add field
              </Button>
            }
          />
        ) : (
          <TableGrid
            fields={table.fields}
            onAddField={() => setAddingField(true)}
            onEditField={setEditingField}
            onDeleteField={removeField}
          />
        )}

        {(addingField || editingField) && (
          <div className="max-w-md">
            {editingField ? (
              <FieldForm
                mode="edit"
                field={editingField}
                onSaved={() => {
                  closeFieldForm();
                  refresh();
                }}
                onCancel={closeFieldForm}
              />
            ) : (
              <FieldForm
                mode="create"
                tableId={table.id}
                onSaved={() => {
                  closeFieldForm();
                  refresh();
                }}
                onCancel={closeFieldForm}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
