import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";

export const billGroupsInsert = t.Object({
  name: t.String(),
  description: t.String(),
  detail: t.String(),
});
export const billGroupsSelect = t.Object({
  id_bill_group: t.Number(),
  name: t.String(),
  detail: t.String(),
  description: t.String(),
  group_code: t.String(),
});

export type BillGroupsInsert = Static<typeof billGroupsInsert>;
export type BillGroups = Static<typeof billGroupsSelect>;

export const billGroupsBase = t.Pick(billGroupsInsert, ["name", "description", "detail"]);
export type BillGroupsBase = Static<typeof billGroupsBase>;

export const billGroupsPayload = t.Intersect([billGroupsBase]);

export type BillGroupsPayload = Static<typeof billGroupsPayload>;

export const billGroupsQuery = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String({ minLength: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export type BillGroupsQuery = Static<typeof billGroupsQuery>;
