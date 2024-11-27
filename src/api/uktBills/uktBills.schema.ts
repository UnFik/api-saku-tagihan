import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { uktBills } from "@/db/schema";

export const uktBillInsert = createInsertSchema(uktBills);
export const uktBillSelect = createSelectSchema(uktBills);

export type UktBillInsert = Static<typeof uktBillInsert>;
export type UktBill = Static<typeof uktBillSelect>;

export const uktBillBase = t.Pick(uktBillInsert, [
  "name",
  "semester",
  "billNumber",
  "nim",
  "amount",
  "status",
  "filename",
  "description",
  "uktCategory",
  "dueDate",
  "flagStatus",
  "majorId",
  "billIssueId",
  "filename",
]);
export type UktBillBase = Static<typeof uktBillBase>;

export const uktBillPayload = t.Intersect([uktBillBase]);
export type UktBillPayload = Static<typeof uktBillPayload>;

export const uktBillQuery = t.Object({
  description: t.Optional(t.String({ minLength: 1 })),
  semester: t.Optional(t.String({ minLength: 1 })),
  billGroup: t.Optional(t.String({ minLength: 1 })),
  billTypeId: t.Optional(t.Number()),
  billIssueId: t.Optional(t.Number()),
  limit: t.Optional(t.Numeric({ minimum: 1 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export type UktBillQuery = Static<typeof uktBillQuery>;
