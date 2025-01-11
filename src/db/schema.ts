import {
  integer,
  pgTable,
  varchar,
  timestamp,
  serial,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

export const flagBillEnum = pgEnum("flag_status_bill", ["88", "01", "02"]); // 88 = hold, 01 = process, 02 = paid
export const typeServiceEnum = pgEnum("type_service", ["1", "2", "3"]); // 1 = Layanan Pendidikan, 2 = Layanan Pendidikan Lainnya, 3 = Layanan Non Pendidikan
export const flagUnitEnum = pgEnum("flag_unit", ["1", "2"]); // 1 = Prodi, 2 = Unit Bisnis

export const users = pgTable("users", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey().notNull(),

  billNumber: integer("bill_number").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  semester: integer("semester"),
  nim: varchar("nim", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  flagStatus: flagBillEnum("flag_status").notNull(),
  dueDate: date("due_date"),

  // For multibank
  billIssue: varchar("bill_issue", { length: 255 }).notNull(),
  billIssueId: varchar("bill_issue_id", { length: 255 }).notNull(),
  billGroupId: varchar("bill_group_id", { length: 255 }).notNull(),

  typeService: typeServiceEnum("type_service").notNull(),
  paidDate: date("paid_date"),

  unitId: integer("unit_id")
    .notNull()
    .references(() => unit.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull(),
});

export const unit = pgTable("unit", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("nama_unit", { length: 255 }).notNull(),
  code: varchar("kode_unit", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  flag_status: flagUnitEnum("flag_unit").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("update_at").defaultNow().notNull(),
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
