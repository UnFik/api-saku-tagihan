import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { unit } from "@/db/schema";

// Buat schema untuk insert dan select
export const unitInsert = createInsertSchema(unit);
export const unitSelect = createSelectSchema(unit);

export type UnitInsert = Static<typeof unitInsert>;
export type UnitSelect = Static<typeof unitSelect>;

export const unitBase = t.Object({
  name: t.String(),
  code: t.String(),
  company: t.String(),
});

export type UnitBase = Static<typeof unitBase>;

export const unitPayload = unitBase;
export type UnitPayload = Static<typeof unitPayload>;

export const unitQuery = t.Object({
  name: t.Optional(t.String()),
  flagStatus: t.Optional(t.Number()),
  code: t.Optional(t.String()),
  company: t.Optional(t.String()),
  per_page: t.Optional(t.Numeric()),
  operator: t.Optional(t.Enum({ and: "and", or: "or" })),
});

export type UnitQuery = Static<typeof unitQuery>;
