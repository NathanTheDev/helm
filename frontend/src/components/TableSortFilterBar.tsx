"use client";

import {
  FILTER_OPERATORS_BY_TYPE,
  type CustomField,
  type FilterOperator,
  type SortDirection,
} from "@/lib/tablesApi";
import { renderFieldControl } from "@/components/FieldForm";
import { Select } from "@/components/ui/Select";
import { Button, IconButton } from "@/components/ui/Button";
import { ArrowUpIcon, ArrowDownIcon, FilterIcon } from "@/components/ui/Icon";

type TableSortFilterBarProps = {
  fields: CustomField[];
  sortFieldId: string | null;
  sortDirection: SortDirection;
  onSortFieldChange: (fieldId: string | null) => void;
  onToggleSortDirection: () => void;
  filterFieldId: string | null;
  filterOperator: FilterOperator | null;
  filterValue: unknown;
  onFilterFieldChange: (fieldId: string | null) => void;
  onFilterOperatorChange: (operator: FilterOperator) => void;
  onFilterValueChange: (value: unknown) => void;
  onClearFilter: () => void;
};

export function TableSortFilterBar({
  fields,
  sortFieldId,
  sortDirection,
  onSortFieldChange,
  onToggleSortDirection,
  filterFieldId,
  filterOperator,
  filterValue,
  onFilterFieldChange,
  onFilterOperatorChange,
  onFilterValueChange,
  onClearFilter,
}: TableSortFilterBarProps) {
  const sortField = fields.find((f) => f.id === sortFieldId) ?? null;
  const filterField = fields.find((f) => f.id === filterFieldId) ?? null;
  const operators = filterField ? FILTER_OPERATORS_BY_TYPE[filterField.type] : [];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Sort</span>
        <Select
          value={sortFieldId ?? ""}
          onChange={(e) => onSortFieldChange(e.target.value || null)}
          aria-label="Sort field"
        >
          <option value="">None</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </Select>
        <IconButton
          onClick={onToggleSortDirection}
          disabled={!sortField}
          aria-label={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
        >
          {sortDirection === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </IconButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterIcon className="h-3.5 w-3.5 text-ink-muted" />
        <Select
          value={filterFieldId ?? ""}
          onChange={(e) => onFilterFieldChange(e.target.value || null)}
          aria-label="Filter field"
        >
          <option value="">No filter</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </Select>

        {filterField && (
          <>
            <Select
              value={filterOperator ?? ""}
              onChange={(e) => onFilterOperatorChange(e.target.value as FilterOperator)}
              aria-label="Filter operator"
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
            {renderFieldControl(filterField, filterValue, onFilterValueChange)}
            <Button variant="ghost" size="xs" onClick={onClearFilter}>
              Clear filter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
