import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
// import { billIssues } from "@/db/schema";

// export const billIssueInsert = createInsertSchema(billIssues);
// export const billIssueSelect = createSelectSchema(billIssues);

// export type BillIssueInsert = Static<typeof billIssueInsert>;
// export type BillIssue = Static<typeof billIssueSelect>;

export const billIssueBase = t.Object({
  bill_group_id: t.String(),
  description: t.String(),
  semester: t.Integer(),
  start_date: t.String(),
  end_date: t.String(),
});
export type BillIssueBase = Static<typeof billIssueBase>;

export const billIssuePayload = t.Pick(billIssueBase, [
  "bill_group_id",
  "description",
  "semester",
  "start_date",
  "end_date",
]);
export type BillIssuePayload = Static<typeof billIssuePayload>;

export const billIssueUpdatePayload = t.Partial(billIssuePayload);

export type BillIssueUpdatePayload = Static<typeof billIssueUpdatePayload>;

export const billIssueQuery = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String({ minLength: 1 })),
  billTypeId: t.Optional(t.Number()),
  limit: t.Optional(t.Numeric({ minimum: 1 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export type BillIssueQuery = Static<typeof billIssueQuery>;
