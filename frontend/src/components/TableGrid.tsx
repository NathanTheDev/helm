"use client";

import { Fragment } from "react";
import { formatCellValue, type CustomField, type CustomRow } from "@/lib/tablesApi";
import { FIELD_TYPE_LABELS } from "@/components/FieldForm";
import { RowForm } from "@/components/RowForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon } from "@/components/ui/Icon";

function renderCell(field: CustomField, value: unknown) {
  if (field.type === "CHECKBOX") {
    return value ? (
      <CheckIcon className="h-4 w-4 text-sage" />
    ) : (
      <span className="text-ink-muted">—</span>
    );
  }

  const formatted = formatCellValue(field, value);

  if (field.type === "SELECT") {
    return formatted === "—" ? (
      <span className="text-ink-muted">—</span>
    ) : (
      <Badge size="xs">{formatted}</Badge>
    );
  }

  return <span className={field.type === "TEXT" ? "block max-w-[16rem] truncate" : ""}>{formatted}</span>;
}

type TableGridProps = {
  fields: CustomField[];
  rows: CustomRow[];
  editingRowId: string | null;
  onAddField: () => void;
  onEditField: (field: CustomField) => void;
  onDeleteField: (field: CustomField) => void;
  onEditRow: (row: CustomRow) => void;
  onRowSaved: (row: CustomRow) => void;
  onCancelEditRow: () => void;
  onDeleteRow: (row: CustomRow) => void;
};

export function TableGrid({
  fields,
  rows,
  editingRowId,
  onAddField,
  onEditField,
  onDeleteField,
  onEditRow,
  onRowSaved,
  onCancelEditRow,
  onDeleteRow,
}: TableGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="divide-x divide-line border-b border-line">
              {fields.map((field) => (
                <th key={field.id} className="whitespace-nowrap px-4 py-3 align-middle font-medium text-ink">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{field.name}</span>
                    <Badge size="xs">{FIELD_TYPE_LABELS[field.type]}</Badge>
                    <span className="ml-auto flex items-center gap-1">
                      <IconButton onClick={() => onEditField(field)} aria-label={`Edit field ${field.name}`}>
                        <PencilIcon />
                      </IconButton>
                      <IconButton
                        tone="danger"
                        onClick={() => onDeleteField(field)}
                        aria-label={`Delete field ${field.name}`}
                      >
                        <TrashIcon />
                      </IconButton>
                    </span>
                  </div>
                </th>
              ))}
              <th className="w-10 px-2 py-3 text-right">
                <IconButton onClick={onAddField} aria-label="Add field">
                  <PlusIcon />
                </IconButton>
              </th>
            </tr>
          </thead>
          {rows.length > 0 && (
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr className="divide-x divide-line border-b border-line">
                    {fields.map((field) => (
                      <td
                        key={field.id}
                        className={`px-4 py-3 align-middle text-ink ${
                          field.type === "NUMBER" ? "text-right font-mono" : ""
                        }`}
                      >
                        {renderCell(field, row.values[field.id])}
                      </td>
                    ))}
                    <td className="px-2 py-3 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <IconButton onClick={() => onEditRow(row)} aria-label="Edit row">
                          <PencilIcon />
                        </IconButton>
                        <IconButton tone="danger" onClick={() => onDeleteRow(row)} aria-label="Delete row">
                          <TrashIcon />
                        </IconButton>
                      </span>
                    </td>
                  </tr>
                  {editingRowId === row.id && (
                    <tr className="border-b border-line">
                      <td colSpan={fields.length + 1} className="bg-paper/40 p-4">
                        <RowForm
                          mode="edit"
                          fields={fields}
                          row={row}
                          onSaved={onRowSaved}
                          onCancel={onCancelEditRow}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          )}
        </table>
      </Card>

      {rows.length === 0 && (
        <EmptyState title="No rows yet." description="Add your first row below." />
      )}
    </div>
  );
}
