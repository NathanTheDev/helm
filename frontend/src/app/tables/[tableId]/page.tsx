"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getTable,
  getRows,
  deleteTable,
  deleteField,
  deleteRow,
  sortRows,
  filterRows,
  FILTER_OPERATORS_BY_TYPE,
  type CustomTableWithFields,
  type CustomField,
  type CustomRow,
  type SortDirection,
  type FilterOperator,
} from "@/lib/tablesApi";
import { TableGrid } from "@/components/TableGrid";
import { TableSortFilterBar } from "@/components/TableSortFilterBar";
import { FieldForm } from "@/components/FieldForm";
import { RowForm } from "@/components/RowForm";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrashIcon } from "@/components/ui/Icon";

export default function TableDetailPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();

  const [table, setTable] = useState<CustomTableWithFields | null>(null);
  const [rows, setRows] = useState<CustomRow[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingField, setAddingField] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [sortFieldId, setSortFieldId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterFieldId, setFilterFieldId] = useState<string | null>(null);
  const [filterOperator, setFilterOperator] = useState<FilterOperator | null>(null);
  const [filterValue, setFilterValue] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    // Resets loading/error state when navigating between tables (same page
    // component instance, different tableId).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFailed(false);

    Promise.all([getTable(tableId), getRows(tableId)])
      .then(([loadedTable, loadedRows]) => {
        if (cancelled) return;
        setTable(loadedTable);
        setRows(loadedRows);
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

  const refreshRows = () => {
    getRows(tableId)
      .then(setRows)
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
      .then(() => {
        refresh();
        refreshRows();
      })
      .catch(() => {});
  };

  const closeFieldForm = () => {
    setAddingField(false);
    setEditingField(null);
  };

  const handleRowCreated = (row: CustomRow) => {
    setRows((prev) => [...prev, row]);
  };

  const handleRowSaved = (row: CustomRow) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
    setEditingRowId(null);
  };

  const removeRow = (row: CustomRow) => {
    if (!confirm("Delete this row? This can't be undone.")) return;
    deleteRow(row.id)
      .then(() => setRows((prev) => prev.filter((r) => r.id !== row.id)))
      .catch(() => {});
  };

  const handleFilterFieldChange = (fieldId: string | null) => {
    setFilterFieldId(fieldId);
    const field = fieldId ? (table?.fields.find((f) => f.id === fieldId) ?? null) : null;
    setFilterOperator(field ? FILTER_OPERATORS_BY_TYPE[field.type][0].value : null);
    setFilterValue(field?.type === "CHECKBOX" ? false : null);
  };

  const clearFilter = () => {
    setFilterFieldId(null);
    setFilterOperator(null);
    setFilterValue(null);
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

  const sortField = table.fields.find((f) => f.id === sortFieldId) ?? null;
  const filterField = table.fields.find((f) => f.id === filterFieldId) ?? null;

  let displayedRows = rows;
  if (filterField && filterOperator) {
    displayedRows = filterRows(displayedRows, filterField, filterOperator, filterValue);
  }
  if (sortField) {
    displayedRows = sortRows(displayedRows, sortField, sortDirection);
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
          <>
            <TableSortFilterBar
              fields={table.fields}
              sortFieldId={sortFieldId}
              sortDirection={sortDirection}
              onSortFieldChange={setSortFieldId}
              onToggleSortDirection={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
              filterFieldId={filterFieldId}
              filterOperator={filterOperator}
              filterValue={filterValue}
              onFilterFieldChange={handleFilterFieldChange}
              onFilterOperatorChange={setFilterOperator}
              onFilterValueChange={setFilterValue}
              onClearFilter={clearFilter}
            />
            <TableGrid
              fields={table.fields}
              rows={displayedRows}
              isFiltered={Boolean(filterField && filterOperator)}
              editingRowId={editingRowId}
              onAddField={() => setAddingField(true)}
              onEditField={setEditingField}
              onDeleteField={removeField}
              onEditRow={(row) => setEditingRowId(row.id)}
              onRowSaved={handleRowSaved}
              onCancelEditRow={() => setEditingRowId(null)}
              onDeleteRow={removeRow}
            />
            <RowForm mode="create" tableId={table.id} fields={table.fields} onCreated={handleRowCreated} />
          </>
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
