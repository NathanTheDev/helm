import type { Request, Response } from "express";
import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import {
  createTableSchema,
  updateTableSchema,
  createFieldSchema,
  updateFieldSchema,
  createRowSchema,
  updateRowSchema,
} from "../validation/customTable";
import {
  buildRowValues,
  mergeRowValues,
  validateFieldValue,
  RowValidationError,
} from "../services/customTableValues";

export const tablesRouter = Router();
// /api/tables/:tableId/fields — create only; the list is folded into
// GET /api/tables/:id.
export const tableFieldsRouter = Router({ mergeParams: true });
// /api/fields/:id — update + delete by id
export const fieldsRouter = Router();
// /api/tables/:tableId/rows
export const tableRowsRouter = Router({ mergeParams: true });
// /api/rows/:id
export const rowsRouter = Router();

type TableParams = { tableId: string };

async function findOwnedTable(tableId: string, userId: string) {
  return prisma.customTable.findFirst({ where: { id: tableId, userId } });
}

// Fields/rows have no userId of their own — ownership is inherited from
// their parent table (mirrors SubTask -> Task.userId).
async function findOwnedField(fieldId: string, userId: string) {
  return prisma.customField.findFirst({ where: { id: fieldId, table: { userId } } });
}

async function findOwnedRow(rowId: string, userId: string) {
  return prisma.customRow.findFirst({ where: { id: rowId, table: { userId } } });
}

function sendIfValidationError(res: Response, err: unknown): boolean {
  if (err instanceof RowValidationError) {
    res.status(400).json({ error: err.fieldErrors });
    return true;
  }
  return false;
}

// ---- tables ----

tablesRouter.get("/", async (req, res) => {
  const tables = await prisma.customTable.findMany({
    where: { userId: req.userId },
    orderBy: { position: "asc" },
  });
  res.json(tables);
});

tablesRouter.post("/", async (req, res) => {
  const parsed = createTableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const max = await prisma.customTable.aggregate({
    where: { userId: req.userId },
    _max: { position: true },
  });
  const position = (max._max.position ?? 0) + 1;

  const table = await prisma.customTable.create({
    data: { ...parsed.data, userId: req.userId, position },
  });
  res.status(201).json(table);
});

tablesRouter.get("/:id", async (req, res) => {
  const table = await findOwnedTable(req.params.id, req.userId);
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }
  const fields = await prisma.customField.findMany({
    where: { tableId: table.id },
    orderBy: { position: "asc" },
  });
  res.json({ ...table, fields });
});

tablesRouter.patch("/:id", async (req, res) => {
  const parsed = updateTableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await findOwnedTable(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Table not found" });
  }

  const table = await prisma.customTable.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(table);
});

tablesRouter.delete("/:id", async (req, res) => {
  const existing = await findOwnedTable(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Table not found" });
  }

  await prisma.customTable.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---- fields ----

tableFieldsRouter.post("/", async (req: Request<TableParams>, res: Response) => {
  const table = await findOwnedTable(req.params.tableId, req.userId);
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }

  const parsed = createFieldSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let defaultValue: unknown;
  try {
    defaultValue = validateFieldValue(
      { name: parsed.data.name, type: parsed.data.type, config: parsed.data.config ?? null },
      parsed.data.defaultValue,
    );
  } catch (err) {
    if (sendIfValidationError(res, err)) return;
    throw err;
  }

  const max = await prisma.customField.aggregate({
    where: { tableId: table.id },
    _max: { position: true },
  });
  const position = (max._max.position ?? 0) + 1;

  const field = await prisma.customField.create({
    data: {
      tableId: table.id,
      name: parsed.data.name,
      type: parsed.data.type,
      config: parsed.data.config,
      defaultValue: defaultValue === null ? undefined : defaultValue,
      position,
    },
  });
  res.status(201).json(field);
});

fieldsRouter.patch("/:id", async (req, res) => {
  const existing = await findOwnedField(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Field not found" });
  }

  const parsed = updateFieldSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const config = parsed.data.config ?? existing.config;
  const hasDefaultValueKey = Object.prototype.hasOwnProperty.call(parsed.data, "defaultValue");

  let defaultValue: unknown = existing.defaultValue;
  if (hasDefaultValueKey) {
    try {
      defaultValue = validateFieldValue(
        { name: parsed.data.name ?? existing.name, type: existing.type, config },
        parsed.data.defaultValue,
      );
    } catch (err) {
      if (sendIfValidationError(res, err)) return;
      throw err;
    }
  }

  const field = await prisma.customField.update({
    where: { id: req.params.id },
    data: {
      name: parsed.data.name,
      config: parsed.data.config,
      defaultValue: hasDefaultValueKey ? (defaultValue as Prisma.InputJsonValue) : undefined,
      position: parsed.data.position,
    },
  });
  res.json(field);
});

fieldsRouter.delete("/:id", async (req, res) => {
  const existing = await findOwnedField(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Field not found" });
  }

  await prisma.customField.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---- rows ----

tableRowsRouter.get("/", async (req: Request<TableParams>, res: Response) => {
  const table = await findOwnedTable(req.params.tableId, req.userId);
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }

  const rows = await prisma.customRow.findMany({
    where: { tableId: table.id },
    orderBy: { position: "asc" },
  });
  res.json(rows);
});

tableRowsRouter.post("/", async (req: Request<TableParams>, res: Response) => {
  const table = await findOwnedTable(req.params.tableId, req.userId);
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }

  const parsed = createRowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const fields = await prisma.customField.findMany({ where: { tableId: table.id } });

  let values: Record<string, unknown>;
  try {
    values = buildRowValues(fields, parsed.data.values ?? {});
  } catch (err) {
    if (sendIfValidationError(res, err)) return;
    throw err;
  }

  const max = await prisma.customRow.aggregate({
    where: { tableId: table.id },
    _max: { position: true },
  });
  const position = (max._max.position ?? 0) + 1;

  const row = await prisma.customRow.create({
    data: { tableId: table.id, values: values as Prisma.InputJsonValue, position },
  });
  res.status(201).json(row);
});

rowsRouter.patch("/:id", async (req, res) => {
  const existing = await findOwnedRow(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Row not found" });
  }

  const parsed = updateRowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let values = existing.values as Record<string, unknown>;
  if (parsed.data.values) {
    const fields = await prisma.customField.findMany({ where: { tableId: existing.tableId } });
    try {
      values = mergeRowValues(fields, values, parsed.data.values);
    } catch (err) {
      if (sendIfValidationError(res, err)) return;
      throw err;
    }
  }

  const row = await prisma.customRow.update({
    where: { id: req.params.id },
    data: {
      values: values as Prisma.InputJsonValue,
      position: parsed.data.position,
    },
  });
  res.json(row);
});

rowsRouter.delete("/:id", async (req, res) => {
  const existing = await findOwnedRow(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Row not found" });
  }

  await prisma.customRow.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
