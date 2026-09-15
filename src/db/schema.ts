import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
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
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  status: varchar("status", { length: 50 })
    .notNull()
    .default("PLANNED"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

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

  projectId: serial("project_id").notNull(),

  assignedTo: serial("assigned_to"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});