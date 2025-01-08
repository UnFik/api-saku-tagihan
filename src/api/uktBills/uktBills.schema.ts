import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { uktBills } from "@/db/schema";

export const uktBillInsert = t.Object({
  bill_issue_id: t.Number(),
  bill_group_id: t.Number(),
  amount: t.Number(),
  nim: t.String(),
  semester: t.String(),
  name: t.String(),
  flag_status: t.String(),
  due_date: t.Nullable(t.Date()),
  filename: t.String(),
});

export type UktBillInsert = Static<typeof uktBillInsert>;

export const uktBillEdit = t.Object({
  bill_issue_id: t.Optional(t.Number()),
  bill_group_id: t.Optional(t.Number()),
  amount: t.Optional(t.Number()),
  nim: t.Optional(t.String()),
  semester: t.Optional(t.String()),
  name: t.Optional(t.String()),
  flag_status: t.Optional(t.String()),
  due_date: t.Optional(t.Date()),
});

export type UktBillEdit = Static<typeof uktBillEdit>;

export const uktBillReturn = t.Object({
  bill_issue_id: t.Number(),
  bill_number: t.Number(),
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
export type UktBillReturn = Static<typeof uktBillReturn>;

export const uktBillBase = t.Pick(uktBillInsert, [
  "bill_group_id",
  "amount",
  "nim",
  "semester",
  "name",
  "flag_status",
  "due_date",
  "filename"
]);
export type UktBillBase = Static<typeof uktBillBase>;

export const uktBillPayload = uktBillBase;
export type UktBillPayload = Static<typeof uktBillPayload>;

export const uktBillQuery = t.Object({
  semester: t.Optional(t.Number({ minLength: 1 })),
  prodi: t.Optional(t.String({ minLength: 1 })),
  bill_issue: t.Optional(t.Number()),
  per_page: t.Optional(t.Numeric({ minimum: 1 })),
});

export type UktBillQuery = Static<typeof uktBillQuery>;
