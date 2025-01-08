import {
  integer,
  pgTable,
  varchar,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

export const uktBills = pgTable("ukt_bills", {
  id: serial("id").primaryKey().notNull(),

  filename: varchar({ length: 255 }).notNull(),
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

export const dispensationTypes = pgTable("dispensation_types", {
  id: serial("id").primaryKey().notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
