import {
  integer,
  pgTable,
  varchar,
  timestamp,
  serial,
  pgEnum,
  date,
  bigint,
  boolean,
} from "drizzle-orm/pg-core";

export const flagBillEnum = pgEnum("flag_status_bill", ["88", "01", "02"]); // 88 = hold, 01 = process, 02 = paid
export const typeServiceEnum = pgEnum("type_service", ["1", "2", "3"]); // 1 = Layanan Pendidikan, 2 = Layanan Pendidikan Lainnya, 3 = Layanan Non Pendidikan

export const users = pgTable("users", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey().notNull(),

  billNumber: varchar("bill_number", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  semester: integer("semester"),
  identityNumber: varchar("identity_number", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  flagStatus: flagBillEnum("flag_status").notNull(),
  dueDate: date("due_date"),
  isConfirmed: boolean("is_confirmed").default(false).notNull(),
  // For multibank
  billIssue: varchar("bill_issue", { length: 255 }).notNull(),
  billIssueId: varchar("bill_issue_id", { length: 255 }).notNull(),
  billGroupId: varchar("bill_group_id", { length: 255 }).notNull(),
  major: varchar("major", { length: 255 }),

  paidDate: date("paid_date"),

  unitCode: varchar("unit_code", { length: 255 }).notNull(), // Not referenced because some of unit comes to siakad api
  serviceTypeId: integer("service_type_id")
    .notNull()
    .references(() => serviceTypes.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const refJournals = pgTable("ref_journals", {
  id: serial("id").primaryKey().notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  billNumber: varchar("bill_number", { length: 255 })
    .notNull()
    .references(() => bills.billNumber, { onDelete: "cascade" }),
  journalId: integer("journal_id").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const unit = pgTable("unit", {
  code: varchar("code", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
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
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const dispensationTypes = pgTable("dispensation_types", {
  id: serial("id").primaryKey().notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const serviceTypes = pgTable("service_types", {
  id: serial("id").primaryKey().notNull(),

  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 255 }).notNull(),
  typeServiceId: typeServiceEnum("type_service_id").notNull(),
  description: varchar("description", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const activationPeriods = pgTable("activation_periods", {
  id: serial("id").primaryKey().notNull(),

  semester: varchar("semester", { length: 255 }).notNull(),
  start_date: date("start_date"),
  end_date: date("end_date"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
