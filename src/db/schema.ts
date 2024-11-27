import {
  date,
  integer,
  pgTable,
  varchar,
  timestamp,
  uuid,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const flagStatusEnum = pgEnum("flag_status", ["88", "01", "02"]);
export const statusEnum = pgEnum("status", ["BARU", "DIPROSES", "TERVERIFIKASI"]);

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 255 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const uktBills = pgTable("ukt_bills", {
  id: serial("id").primaryKey().notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  semester: varchar("semester", { length: 255 }).notNull(),
  billNumber: varchar("bill_number", { length: 255 }).notNull(),
  nim: varchar("nim", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  status: statusEnum("status").default("BARU").notNull(), // NF
  filename: varchar("filename", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  uktCategory: varchar("ukt_category", { length: 255 }).notNull(),
  dueDate: date("due_date").notNull(),
  flagStatus: flagStatusEnum("flag_status").default("88").notNull(),

  majorId: varchar("major_id", { length: 255 }).notNull(),
  billIssueId: varchar("bill_issue_id", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const uktDispensations = pgTable("ukt_dispensations", {
  id: serial("id").primaryKey().notNull(),

  semester: varchar({ length: 255 }).notNull(),
  prodi: varchar({ length: 255 }).notNull(),
  amount: integer().notNull(),
  status: varchar({ length: 255 }).notNull(),
  filename: varchar({ length: 255 }).notNull(),

  dispensationTypeId: varchar({ length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// export const billTypes = pgTable("bill_types", {
//   id: serial("id").primaryKey().notNull(),
//   name: varchar({ length: 255 }).notNull(),
//   description: varchar({ length: 255 }).notNull(),

//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updateAt: timestamp("update_at").defaultNow().notNull(),
// });

// export const billIssues = pgTable("bill_issues", {
//   id: serial("id").primaryKey().notNull(),

//   billGroup: varchar("bill_group", { length: 255 }).notNull(),
//   description: varchar("description", { length: 255 }).notNull(),
//   semester: varchar("semester", { length: 255 }).notNull(),

//   startDate: date("start_date").notNull(),
//   endDate: date("end_date").notNull(),

//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updateAt: timestamp("update_at").defaultNow().notNull(),
// });

export const dispensationTypes = pgTable("dispensationTypes", {
  id: serial("id").primaryKey().notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
