import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  email: varchar("email", { length: 255 })
    .notNull()
    .unique(),

  password: text("password").notNull(),

  role: varchar("role", { length: 50 })
    .notNull()
    .default("DEVELOPER"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  startDate: timestamp("start_date"),

  endDate: timestamp("end_date"),

  status: varchar("status", { length: 50 })
    .notNull()
    .default("PLANNED"),

  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
}, (table) => [index("projects_created_by_idx").on(table.createdBy)]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  status: varchar("status", { length: 50 })
    .notNull()
    .default("TODO"),

  priority: varchar("priority", { length: 50 })
    .notNull()
    .default("MEDIUM"),

  dueDate: timestamp("due_date"),

  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),

  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
}, (table) => [
  index("tasks_status_idx").on(table.status),
  index("tasks_project_id_idx").on(table.projectId),
  index("tasks_assigned_to_idx").on(table.assignedTo),
  index("tasks_due_date_idx").on(table.dueDate),
]);