"use client";

import type { CustomField } from "@/lib/tablesApi";
import { FIELD_TYPE_LABELS } from "@/components/FieldForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { PencilIcon, TrashIcon, PlusIcon } from "@/components/ui/Icon";

type TableGridProps = {
  fields: CustomField[];
  onAddField: () => void;
  onEditField: (field: CustomField) => void;
  onDeleteField: (field: CustomField) => void;
};

export function TableGrid({ fields, onAddField, onEditField, onDeleteField }: TableGridProps) {
  return (
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
      </table>
    </Card>
  );
}
