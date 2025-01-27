import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { queueTracker } from "@/db/schema";

// Buat schema untuk select
export const queueTrackerSelect = createSelectSchema(queueTracker);
export type QueueTrackerSelect = Static<typeof queueTrackerSelect>;

// Buat query schema
export const queueTrackerQuery = t.Object({
  semester: t.Optional(t.String()),
  billIssue: t.Optional(t.String()),
  major: t.Optional(t.String()),
  status: t.Optional(t.String()),
  per_page: t.Optional(t.Numeric()),
  page: t.Optional(t.Numeric()),
});

export type QueueTrackerQuery = Static<typeof queueTrackerQuery>;