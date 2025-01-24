import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { bills } from "@/db/schema";

// Buat schema untuk insert dan select
export const billInsert = createInsertSchema(bills);
export const billInsertWithoutNumber = t.Omit(billInsert, ["billNumber"]);
export const billSelect = createSelectSchema(bills);

export type BillInsert = Static<typeof billInsert>;
export type BillInsertWithoutNumber = Static<typeof billInsertWithoutNumber>;
export type BillSelect = Static<typeof billSelect>;

export const billConfirm = t.Object({
  amount: t.Optional(t.Number()),
  dueDate: t.Optional(t.Nullable(t.String())),
  billNumber: t.String(),
});

export type BillConfirm = Static<typeof billConfirm>;

export const billReturn = t.Object({
  bill_issue_id: t.Number(),
  bill_number: t.String(),
  amount: t.Number(),
  nim: t.String(),
  semester: t.Number(),
  name: t.String(),
  bank_id: t.Nullable(t.Number()),
  transaction: t.Nullable(t.String()),
  transaction_date: t.Nullable(t.Date()),
  keterangan: t.String(),
  due_date: t.Nullable(t.Date()),
  flag_status: t.String(),
});

export type BillReturn = Static<typeof billReturn>;

export const billBase = t.Object({
  amount: t.Optional(t.Number()),
  dueDate: t.Nullable(t.Date()),
  flagStatus: t.Optional(t.String()),
});

export type BillBase = Static<typeof billBase>;

export const billPayload = billBase;
export type BillPayload = Static<typeof billPayload>;

export const billQuery = t.Object({
  semester: t.Optional(t.String()),
  unitCode: t.Optional(t.String()),
  billIssueId: t.Optional(t.String()),
  serviceTypeId: t.Optional(t.String()),
  operator: t.Optional(t.Enum({ and: "and", or: "or" })),
  per_page: t.Optional(t.Numeric()),
});

export type BillQuery = Static<typeof billQuery>;
