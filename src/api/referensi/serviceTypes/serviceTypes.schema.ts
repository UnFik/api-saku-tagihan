import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { serviceTypes } from "@/db/schema";

// Buat schema untuk insert dan select
export const serviceTypeInsert = createInsertSchema(serviceTypes);
export const serviceTypeSelect = createSelectSchema(serviceTypes);

export type ServiceTypeInsert = Static<typeof serviceTypeInsert>;
export type ServiceTypeSelect = Static<typeof serviceTypeSelect>;

export const serviceTypeBase = t.Object({
  name: t.String(),
  description: t.String(),
});

export type ServiceTypeBase = Static<typeof serviceTypeBase>;

export const serviceTypePayload = serviceTypeBase;
export type ServiceTypePayload = Static<typeof serviceTypePayload>;

export const serviceTypeQuery = t.Object({
  name: t.Optional(t.String()),
  description: t.Optional(t.String()),
  per_page: t.Optional(t.Numeric()),
});

export type ServiceTypeQuery = Static<typeof serviceTypeQuery>;