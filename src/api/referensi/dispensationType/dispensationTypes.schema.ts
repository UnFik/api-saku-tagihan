import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { dispensationTypes } from "@/db/schema";

// Buat schema untuk insert dan select
export const dispensationTypeInsert = createInsertSchema(dispensationTypes);
export const dispensationTypeSelect = createSelectSchema(dispensationTypes);

// Definisikan tipe dari schema
export type DispensationTypeInsert = Static<typeof dispensationTypeInsert>;
export type DispensationType = Static<typeof dispensationTypeSelect>;

// Buat schema dasar untuk dispensationType
export const dispensationTypeBase = t.Pick(dispensationTypeInsert, [
  "name",
  "description",
  "id",
]);
export type DispensationTypeBase = Static<typeof dispensationTypeBase>;

// Buat payload schema
export const dispensationTypePayload = t.Intersect([
  dispensationTypeBase,
  t.Object({
    id: t.Optional(t.Array(t.String())),
  }),
]);
export type DispensationTypePayload = Static<typeof dispensationTypePayload>;

// Buat query schema untuk pencarian dan pagination
export const dispensationTypeQuery = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String({ minLength: 1 })),
  favorited: t.Optional(t.String({ minLength: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export type DispensationTypeQuery = Static<typeof dispensationTypeQuery>;
