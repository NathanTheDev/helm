"use client";

import { Fragment } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatCellValue, type CustomField, type CustomRow } from "@/lib/tablesApi";
import { FIELD_TYPE_LABELS } from "@/components/FieldForm";
import { RowForm } from "@/components/RowForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, GripIcon } from "@/components/ui/Icon";

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

function DragHandle({
  label,
  disabled,
  attributes,
  listeners,
}: {
  label: string;
  disabled: boolean;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={`shrink-0 text-ink-muted/60 transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-30"
          : "cursor-grab hover:text-ink-muted active:cursor-grabbing"
      }`}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
    >
      <GripIcon className="h-3.5 w-3.5" />
    </button>
  );
}

function FieldHeader({
  field,
  i,
  onEditField,
  onDeleteField,
}: {
  field: CustomField;
  i: number;
  onEditField: (field: CustomField) => void;
  onDeleteField: (field: CustomField) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`group whitespace-nowrap px-4 py-3 align-middle font-medium text-ink ${
        i === 0 ? "sticky left-0 z-10 bg-surface" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <DragHandle
          label={`Drag field ${field.name}`}
          disabled={false}
          attributes={attributes}
          listeners={listeners}
        />
        <span className="truncate">{field.name}</span>
        <Badge size="xs">{FIELD_TYPE_LABELS[field.type]}</Badge>
        <span className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
  );
}

function TableRow({
  row,
  fields,
  editing,
  reorderable,
  onEditRow,
  onDeleteRow,
}: {
  row: CustomRow;
  fields: CustomField[];
  editing: boolean;
  reorderable: boolean;
  onEditRow: (row: CustomRow) => void;
  onDeleteRow: (row: CustomRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: editing || !reorderable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group divide-x divide-line border-b border-line transition-colors hover:bg-paper/40"
    >
      {fields.map((field, i) => (
        <td
          key={field.id}
          className={`px-4 py-3 align-middle text-ink ${
            field.type === "NUMBER" ? "text-right font-mono" : ""
          } ${i === 0 ? "sticky left-0 z-10 bg-surface group-hover:bg-paper/40" : ""}`}
        >
          <div className="flex items-center gap-2">
            {i === 0 && (
              <DragHandle
                label="Drag row"
                disabled={editing || !reorderable}
                attributes={attributes}
                listeners={listeners}
              />
            )}
            {renderCell(field, row.values[field.id])}
          </div>
        </td>
      ))}
      <td className="px-2 py-3 text-right">
        <span className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <IconButton onClick={() => onEditRow(row)} aria-label="Edit row">
            <PencilIcon />
          </IconButton>
          <IconButton tone="danger" onClick={() => onDeleteRow(row)} aria-label="Delete row">
            <TrashIcon />
          </IconButton>
        </span>
      </td>
    </tr>
  );
}

type TableGridProps = {
  fields: CustomField[];
  rows: CustomRow[];
  isFiltered?: boolean;
  rowsReorderable?: boolean;
  editingRowId: string | null;
  onAddField: () => void;
  onEditField: (field: CustomField) => void;
  onDeleteField: (field: CustomField) => void;
  onReorderField: (activeId: string, overId: string) => void;
  onEditRow: (row: CustomRow) => void;
  onRowSaved: (row: CustomRow) => void;
  onCancelEditRow: () => void;
  onDeleteRow: (row: CustomRow) => void;
  onReorderRow: (activeId: string, overId: string) => void;
};

export function TableGrid({
  fields,
  rows,
  isFiltered = false,
  rowsReorderable = true,
  editingRowId,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderField,
  onEditRow,
  onRowSaved,
  onCancelEditRow,
  onDeleteRow,
  onReorderRow,
}: TableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleFieldDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) onReorderField(active.id as string, over.id as string);
  };

  const handleRowDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) onReorderRow(active.id as string, over.id as string);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
            <thead>
              <tr className="divide-x divide-line border-b border-line">
                <SortableContext items={fields.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
                  {fields.map((field, i) => (
                    <FieldHeader
                      key={field.id}
                      field={field}
                      i={i}
                      onEditField={onEditField}
                      onDeleteField={onDeleteField}
                    />
                  ))}
                </SortableContext>
                <th className="w-10 px-2 py-3 text-right">
                  <IconButton onClick={onAddField} aria-label="Add field">
                    <PlusIcon />
                  </IconButton>
                </th>
              </tr>
            </thead>
          </DndContext>
          {rows.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
              <tbody>
                <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                  {rows.map((row) => (
                    <Fragment key={row.id}>
                      <TableRow
                        row={row}
                        fields={fields}
                        editing={editingRowId === row.id}
                        reorderable={rowsReorderable}
                        onEditRow={onEditRow}
                        onDeleteRow={onDeleteRow}
                      />
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
                </SortableContext>
              </tbody>
            </DndContext>
          )}
        </table>
      </Card>

      {rows.length === 0 &&
        (isFiltered ? (
          <EmptyState title="No rows match this filter." description="Try a different value, or clear the filter." />
        ) : (
          <EmptyState title="No rows yet." description="Add your first row below." />
        ))}

      {!rowsReorderable && rows.length > 0 && (
        <p className="-mt-2 font-mono text-[11px] text-ink-muted">
          Clear sort/filter to drag-reorder rows.
        </p>
      )}
    </div>
  );
}
