import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";

export const taskStatuses = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function isTodayOrLater(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(date.getTime()) && date >= today;
}

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(255),
  description: z.string().trim().max(5000, "Description is too long").optional(),
  projectId: z.coerce.number().int().positive("A project is required"),
  assignedTo: z.preprocess((value) => value === "" || value === null ? null : Number(value), z.number().int().positive().nullable()),
  status: z.enum(taskStatuses, { message: "Task status is invalid" }),
  priority: z.enum(taskPriorities, { message: "Task priority is invalid" }),
  dueDate: z.string().trim().optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Due date is invalid")
    .refine((value) => !value || isTodayOrLater(value), "Due date cannot be in the past"),
});

export async function getTaskUser() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!session?.user || !userId) return null;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export function canManageTasks(role: string) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canDeleteTasks(role: string) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canEditTask(role: string, userId: number, task: { assignedTo: number | null }) {
  return canManageTasks(role);
}

export function canUpdateTaskStatus(role: string, userId: number, task: { assignedTo: number | null }) {
  return canManageTasks(role) || (role === "DEVELOPER" && task.assignedTo === userId);
}

export async function canAccessProject(userId: number, role: string, projectId: number) {
  if (role === "ADMIN" || role === "MANAGER") return true;

  const [assignedTask] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.assignedTo, userId)))
    .limit(1);

  return Boolean(assignedTask);
}

export async function validateTaskRelations(projectId: number, assignedTo: number | null) {
  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return "Project not found";

  if (assignedTo !== null) {
    const [developer] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, assignedTo)).limit(1);
    if (!developer || developer.role !== "DEVELOPER") return "Tasks can only be assigned to developers";
  }

  return null;
}

export function toTaskValues(input: z.infer<typeof taskInputSchema>) {
  return {
    title: input.title,
    description: input.description || null,
    projectId: input.projectId,
    assignedTo: input.assignedTo,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00`) : null,
  };
}

export function formatTaskDate(value: Date | null) {
  return value ? value.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not set";
}
