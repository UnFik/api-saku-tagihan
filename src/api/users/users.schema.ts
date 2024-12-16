import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { users } from "../../db/schema";
import type { Static } from "elysia";

export const userInsert = createInsertSchema(users);
export const userSelect = createSelectSchema(users);

export type UserInsert = Static<typeof userInsert>;
export type User = Static<typeof userSelect>;

export interface AuthSiakad {
  username?: string;
  mode?: string;
  nama?: string;
  kelamin?: string;
  status: boolean;
  unit?: string;
  Authorization?: string;
  msg: string;
}